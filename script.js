
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
        restart: document.getElementById('restart-button')
    };

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

        // 게임 설정 저장
        gameState.mode = parseInt(settings.modeSelect.value);
        gameState.timeLimit = parseInt(settings.timeSelect.value);
        gameState.hearts = parseInt(settings.heartSelect.value);
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
        const candidates = [];
        
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
            cell.addEventListener('click', () => handleCellClick(cell, num));
            gameElements.board.appendChild(cell);
        });
    }

    // 셀 클릭 처리
    function handleCellClick(cell, num) {
        if (!gameState.active || gameState.clicked.has(num)) return;
        
        gameState.clicked.add(num);
        
        if (gameState.primeMap[num]) {
            cell.style.backgroundColor = 'blue';
            gameState.score += 10;
        } else {
            cell.style.backgroundColor = 'red';
            gameState.hearts--;
        }
        
        updateUI();
        resetTimer();
        
        if (gameState.hearts <= 0) {
            endGame();
        }
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

    // 더이상 소수없음 처리
    function handleNoMorePrimes() {
        if (!gameState.active) return;

        if (!hasRemainingPrimes()) {
            gameState.score += 30;
            gameState.stage++;
            generateNumbers();
            createBoard();
            updateUI();
            resetTimer();
        } else {
            gameState.hearts--;
            updateUI();
            if (gameState.hearts <= 0) {
                endGame();
            }
        }
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

    function hasRemainingPrimes() {
        return gameState.numbers.some(num => 
            gameState.primeMap[num] && !gameState.clicked.has(num)
        );
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function saveHighScore(score) {
        try {
            const scores = JSON.parse(localStorage.getItem('highScores') || '[]');
            scores.push(score);
            scores.sort((a, b) => b - a);
            localStorage.setItem('highScores', JSON.stringify(scores.slice(0, 5)));
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }

    function displayHighScores() {
        try {
            const scores = JSON.parse(localStorage.getItem('highScores') || '[]');
            gameElements.highScores.innerHTML = scores
                .map(score => `<li>${score}</li>`)
                .join('');
        } catch (error) {
            console.error('Failed to display high scores:', error);
        }
    }
});
