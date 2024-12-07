document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 참조
    const screens = {
        start: document.getElementById('start-screen'),
        settings: document.getElementById('settings-screen'),
        game: document.getElementById('game-screen'),
        gameover: document.getElementById('gameover-screen')
    };

    const buttons = {
    start: document.getElementById('start-button'),
    startGame: document.getElementById('start-game-button'),
    noMorePrimes: document.getElementById('no-more-primes-btn'),
    restart: document.getElementById('restart-button'),
    clearRecords: document.getElementById('clear-records-button') // 새로 추가한 버튼
};

// 기록 초기화 버튼 클릭 시 localStorage 비우고 리스트 갱신
buttons.clearRecords.addEventListener('click', () => {
    localStorage.clear();
    displayHighScores();
});

    const gameElements = {
        board: document.getElementById('game-board'),
        hearts: document.getElementById('hearts-container'),
        timer: document.getElementById('timer-container'),
        score: document.getElementById('score'),
        finalScore: document.getElementById('final-score'),
        highScores: document.getElementById('high-scores-list')
    };

    const settings = {
        modeSelect: document.getElementById('game-mode-select'),
        timeSelect: document.getElementById('time-limit-select'),
        heartSelect: document.getElementById('heart-count-select'),
        rangeStart: document.getElementById('range-start'),
        rangeEnd: document.getElementById('range-end')
    };

    // 게임 상태
    let gameState = {
        active: false,
        mode: 3,
        timeLimit: 40,
        hearts: 2,
        score: 0,
        stage: 1,
        timer: null,
        timeLeft: 40,
        numbers: [],
        primeMap: {},
        clicked: new Set()
    };

    // 초기 화면 설정
    showScreen('start');

    // 이벤트 리스너 설정
    buttons.start.addEventListener('click', () => showScreen('settings'));
    buttons.startGame.addEventListener('click', handleGameStart);
    buttons.restart.addEventListener('click', () => showScreen('settings'));
    buttons.noMorePrimes.addEventListener('click', handleNoMorePrimes);

    // 화면 전환 함수
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
        
        if (screenName === 'start') {
            resetGameState();
        }
    }

    // 게임 시작 처리
    function handleGameStart() {
    if (!validateSettings()) return;

    gameState.mode = parseInt(settings.modeSelect.value);
    gameState.timeLimit = parseInt(settings.timeSelect.value);
    gameState.hearts = parseInt(settings.heartSelect.value);
    gameState.initialHearts = gameState.hearts; // 시작 시 하트 수를 기록

    gameState.timeLeft = gameState.timeLimit;

    initGame();
    showScreen('game');
}

    // 설정 유효성 검사
    function validateSettings() {
        const start = parseInt(settings.rangeStart.value);
        const end = parseInt(settings.rangeEnd.value);
        
        if (isNaN(start) || isNaN(end) || start >= end) {
            alert('올바른 숫자 범위를 입력해주세요.');
            return false;
        }

        let count = 0;
        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) count++;
            if (count >= gameState.mode * gameState.mode) return true;
        }
        
        alert('선택한 범위가 너무 좁습니다. 더 큰 범위를 선택해주세요.');
        return false;
    }

    // 게임 초기화
    function initGame() {
        resetGameState();
        gameState.active = true;
        generateNumbers();
        createBoard();
        updateUI();
        startTimer();
    }

    // 게임 상태 초기화
    function resetGameState() {
        if (gameState.timer) clearInterval(gameState.timer);
        
        gameState = {
            active: false,
            mode: parseInt(settings.modeSelect.value),
            timeLimit: parseInt(settings.timeSelect.value),
            hearts: parseInt(settings.heartSelect.value),
            score: 0,
            stage: 1,
            timer: null,
            timeLeft: parseInt(settings.timeSelect.value),
            numbers: [],
            primeMap: {},
            clicked: new Set()
        };
    }

    // 숫자 생성
    function generateNumbers() {
        const start = parseInt(settings.rangeStart.value);
        const end = parseInt(settings.rangeEnd.value);
        let candidates = [];
        
        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) {
                candidates.push(i);
            }
        }

        shuffleArray(candidates);
        gameState.numbers = candidates.slice(0, gameState.mode * gameState.mode);
        
        gameState.numbers.forEach(num => {
            gameState.primeMap[num] = isPrime(num);
        });
    }

    // 게임판 생성
    function createBoard() {
        gameElements.board.innerHTML = '';
        gameElements.board.style.gridTemplateColumns = `repeat(${gameState.mode}, 1fr)`;
        
        gameState.numbers.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = num;
            
            // 이벤트 리스너를 외부 함수로 분리
            function cellClickHandler() {
                handleCellClick(cell, num);
            }
            cell.addEventListener('click', cellClickHandler);
            
            gameElements.board.appendChild(cell);
        });
    }

    // 셀 클릭 처리
    function handleCellClick(cell, num) {
        if (!gameState.active || gameState.clicked.has(num)) return;
        
        gameState.clicked.add(num);
        
        if (gameState.primeMap[num]) {
            cell.style.backgroundColor = '#0066cc';  // 파란색
            gameState.score += 10;
            cell.classList.add('found-prime');
        } else {
            cell.style.backgroundColor = '#cc0000';  // 빨간색
            gameState.hearts--;
        }
        
        updateUI();
        resetTimer();
        
        if (gameState.hearts <= 0) {
            endGame();
        }
    }

    // 더이상 소수없음 처리
    function handleNoMorePrimes() {
        if (!gameState.active) return;

        // 찾지 않은 소수가 있는지 확인
        const unclickedPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num] && !gameState.clicked.has(num)
        );

        // 모든 소수를 찾았는지 확인
        const allFoundPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num]
        ).every(num => gameState.clicked.has(num));

        if (unclickedPrimes.length === 0 && allFoundPrimes) {
            // 모든 소수를 찾았을 때만 다음 라운드로
            gameState.score += 30;
            gameState.stage++;
            nextRound();
        } else {
            // 아직 찾지 않은 소수가 있으면 하트 감소
            gameState.hearts--;
            updateUI();
            if (gameState.hearts <= 0) {
                endGame();
            }
        }
    }

    // 다음 라운드 시작
    function nextRound() {
        gameState.clicked.clear(); // 클릭 기록 초기화
        generateNumbers();
        createBoard();
        updateUI();
        resetTimer();
    }

    // UI 업데이트
    function updateUI() {
        gameElements.hearts.textContent = '❤️'.repeat(gameState.hearts);
        gameElements.score.textContent = gameState.score;
        gameElements.timer.textContent = `${gameState.timeLeft}초`;
    }

    // 타이머 관련 함수들
    function startTimer() {
        gameState.timeLeft = gameState.timeLimit;
        updateUI();
        
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            updateUI();
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function resetTimer() {
        if (gameState.timer) clearInterval(gameState.timer);
        startTimer();
    }

    // 게임 종료
    function endGame() {
        gameState.active = false;
        if (gameState.timer) clearInterval(gameState.timer);
        
        gameElements.finalScore.textContent = gameState.score;
        saveHighScore(gameState.score);
        displayHighScores();
        showScreen('gameover');
    }

    // 유틸리티 함수들
    function isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

// 최고점수 저장
function saveHighScore(score) {
    try {
        const gameInfo = {
            score: score,
            mode: `${gameState.mode}x${gameState.mode}`,
            range: `${settings.rangeStart.value}~${settings.rangeEnd.value}`,
            timeLimit: gameState.timeLimit,
            // 초기 하트 수와 마지막 남은 하트 수를 모두 저장하고 싶다면 다음과 같이 할 수도 있음
            initialHearts: gameState.initialHearts,
            hearts: gameState.hearts,
            date: new Date().toLocaleDateString()
        };

        let scores = [];
        const savedScores = localStorage.getItem('highScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }

        scores.push(gameInfo);
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5);

        localStorage.setItem('highScores', JSON.stringify(scores));
    } catch (error) {
        console.error('점수 저장 실패:', error);
    }
}

// 최고점수 표시
function displayHighScores() {
    try {
        const highScoresList = document.getElementById('high-scores-list');
        const scores = JSON.parse(localStorage.getItem('highScores') || '[]');

        if (scores.length === 0) {
            highScoresList.innerHTML = '<div class="no-scores">기록이 없습니다</div>';
            return;
        }

        const html = scores.map((info, index) => `
            <li class="high-score-item">
                <div class="score-header">
                    <span class="rank">${index + 1}등</span>
                    <span class="score">${info.score}점</span>
                </div>
                <div class="score-details">
                    ${info.mode} 모드 / ${info.range} / ${info.timeLimit}초 / ❤️${info.hearts}
                </div>
                <div class="score-date">${info.date}</div>
            </li>
        `).join('');

        highScoresList.innerHTML = html;
    } catch (error) {
        console.error('점수 표시 실패:', error);
        highScoresList.innerHTML = '<div class="error">점수를 불러올 수 없습니다</div>';
    }
}
});