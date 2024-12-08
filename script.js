document.addEventListener('DOMContentLoaded', () => {
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
        clearRecords: document.getElementById('clear-records-button')
    };

    const gameElements = {
        board: document.getElementById('game-board'),
        hearts: document.getElementById('hearts-container'),
        timer: document.getElementById('timer-container'),
        score: document.getElementById('score'),
        finalScore: document.getElementById('final-score'),
        highScores: document.getElementById('high-scores-list')
    };

    // 드롭다운 요소 참조
    const rangeStartSelect = document.getElementById('range-start-select');
    const rangeEndSelect = document.getElementById('range-end-select');

    const settings = {
        modeSelect: document.getElementById('game-mode-select'),
        timeSelect: document.getElementById('time-limit-select'),
        heartSelect: document.getElementById('heart-count-select'),
        // input 대신 select를 사용하므로 아래는 필요없음
        // rangeStart: document.getElementById('range-start'),
        // rangeEnd: document.getElementById('range-end')
        rangeStartSelect,
        rangeEndSelect
    };

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

    // 범위 선택 초기화
    initRangeSelects();

    showScreen('start');

    buttons.start.addEventListener('click', () => {
        console.log("start btn click");
        showScreen('settings');
    });
    buttons.startGame.addEventListener('click', handleGameStart);
    buttons.restart.addEventListener('click', () => showScreen('settings'));
    buttons.noMorePrimes.addEventListener('click', handleNoMorePrimes);

    // 기록 초기화 버튼
    buttons.clearRecords.addEventListener('click', () => {
        localStorage.clear();
        displayHighScores();
    });

    // range-start-select 변경 시 끝 범위 갱신
    settings.rangeStartSelect.addEventListener('change', () => {
        populateEndOptions(parseInt(settings.rangeStartSelect.value));
    });

    function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active'); // 모든 화면 숨김
        screen.style.display = 'none';    // 안전하게 display:none 적용
    });
    screens[screenName].classList.add('active'); // 선택된 화면만 활성화
    screens[screenName].style.display = 'flex'; // 선택된 화면 표시

        
        if (screenName === 'start') {
            resetGameState();
        }
    }

    function initRangeSelects() {
        // 시작 범위: 0, 100, 200, ... , 1000
        for (let i = 0; i <= 1000; i += 100) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            settings.rangeStartSelect.appendChild(option);
        }

        // 시작값 0에 대한 끝 범위 기본 설정
        populateEndOptions(0);
    }

    function populateEndOptions(startVal) {
        settings.rangeEndSelect.innerHTML = '';
        // 끝 범위는 시작값+100 부터 100씩 증가 총 10개
        // 즉 startVal+100, startVal+200, ... startVal+1000
        for (let j = 100; j <= 1000; j += 100) {
            const endVal = startVal + j;
            const option = document.createElement('option');
            option.value = endVal;
            option.textContent = endVal;
            settings.rangeEndSelect.appendChild(option);
        }
    }

    function handleGameStart() {
        if (!validateSettings()) return;

        gameState.mode = parseInt(settings.modeSelect.value);
        gameState.timeLimit = parseInt(settings.timeSelect.value);
        gameState.hearts = parseInt(settings.heartSelect.value);
        gameState.initialHearts = gameState.hearts;
        gameState.timeLeft = gameState.timeLimit;

        initGame();
        showScreen('game');
    }

    function validateSettings() {
        const start = parseInt(settings.rangeStartSelect.value);
        const end = parseInt(settings.rangeEndSelect.value);

        if (isNaN(start) || isNaN(end) || start >= end) {
            alert('올바른 숫자 범위를 선택해주세요.');
            return false;
        }

        // 모드에 따라 필요한 숫자 개수 확인
        let count = 0;
        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) count++;
            if (count >= gameState.mode * gameState.mode) return true;
        }
        
        alert('선택한 범위가 너무 좁습니다. 더 큰 범위를 선택해주세요.');
        return false;
    }

    function initGame() {
        resetGameState();
        gameState.active = true;
        generateNumbers();
        createBoard();
        updateUI();
        startTimer();
    }

    function resetGameState() {
        if (gameState.timer) clearInterval(gameState.timer);
        
        gameState = {
            active: false,
            mode: parseInt(settings.modeSelect.value),
            timeLimit: parseInt(settings.timeSelect.value),
            hearts: parseInt(settings.heartSelect.value),
            initialHearts: parseInt(settings.heartSelect.value), // 초기 하트수
            score: 0,
            stage: 1,
            timer: null,
            timeLeft: parseInt(settings.timeSelect.value),
            numbers: [],
            primeMap: {},
            clicked: new Set()
        };
    }

    function generateNumbers() {
        const start = parseInt(settings.rangeStartSelect.value);
        const end = parseInt(settings.rangeEndSelect.value);
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

    function createBoard() {
        gameElements.board.innerHTML = '';
        gameElements.board.style.gridTemplateColumns = `repeat(${gameState.mode}, 1fr)`;
        gameElements.board.style.gridTemplateRows = `repeat(${gameState.mode}, 1fr)`;

        gameState.numbers.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = num;

            cell.addEventListener('click', () => handleCellClick(cell, num));
            
            gameElements.board.appendChild(cell);
        });
    }

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

    function handleNoMorePrimes() {
        if (!gameState.active) return;

        const unclickedPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num] && !gameState.clicked.has(num)
        );

        const allFoundPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num]
        ).every(num => gameState.clicked.has(num));

        if (unclickedPrimes.length === 0 && allFoundPrimes) {
            gameState.score += 30;
            gameState.stage++;
            nextRound();
        } else {
            gameState.hearts--;
            updateUI();
            if (gameState.hearts <= 0) {
                endGame();
            }
        }
    }

    function nextRound() {
        gameState.clicked.clear();
        generateNumbers();
        createBoard();
        updateUI();
        resetTimer();
    }

    function updateUI() {
        gameElements.hearts.textContent = '❤️'.repeat(gameState.hearts);
        gameElements.score.textContent = gameState.score;
        gameElements.timer.textContent = `${gameState.timeLeft}초`;
    }

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

    function endGame() {
        gameState.active = false;
        if (gameState.timer) clearInterval(gameState.timer);
        
        gameElements.finalScore.textContent = gameState.score;
        saveHighScore(gameState.score);
        displayHighScores();
        showScreen('gameover');
    }

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

    function saveHighScore(score) {
        try {
            const gameInfo = {
                score: score,
                mode: `${gameState.mode}x${gameState.mode}`,
                range: `${settings.rangeStartSelect.value}~${settings.rangeEndSelect.value}`,
                timeLimit: gameState.timeLimit,
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
                        <span class="rank">Top ${index + 1}</span>
                        <span class="score">${info.score}</span>
                    </div>
                    <div class="score-details">
                        🏁${info.mode} / ⏱️${info.timeLimit} / ❤️x${info.initialHearts} / 🔢${info.range} 
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
