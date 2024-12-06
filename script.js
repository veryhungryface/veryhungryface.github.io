document.addEventListener('DOMContentLoaded', () => {
    // 화면 전환 및 요소 참조
    const startScreen = document.getElementById('start-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameoverScreen = document.getElementById('gameover-screen');

    const startButton = document.getElementById('start-button');
    const startGameButton = document.getElementById('start-game-button');
    const restartButton = document.getElementById('restart-button');
    const noMorePrimesBtn = document.getElementById('no-more-primes-btn');

    const gameModeSelect = document.getElementById('game-mode-select');
    const timeLimitSelect = document.getElementById('time-limit-select');
    const heartCountSelect = document.getElementById('heart-count-select');
    const rangeStartInput = document.getElementById('range-start');
    const rangeEndInput = document.getElementById('range-end');

    const gameBoard = document.getElementById('game-board');
    const timerContainer = document.getElementById('timer-container');
    const heartsContainer = document.getElementById('hearts-container');
    const scoreDisplay = document.getElementById('score');
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoresList = document.getElementById('high-scores-list');

    // 상태 변수
    let gridSize = 3;             // 게임 모드(3x3, 4x4, 5x5)
    let timeLimit = 40;           // 시간제한
    let heartCount = 2;           // 하트 개수
    let numberRangeStart = 1;     // 숫자 범위 시작
    let numberRangeEnd = 50;      // 숫자 범위 끝
    let timer;                    // 타이머
    let currentTime;              // 현재 시간
    let currentScore = 0;         // 현재 점수
    let currentStage = 1;         // 현재 스테이지
    let heartsRemaining = 2;      // 남은 하트수
    let numbersArray = [];        // 게임판에 표시될 숫자들
    let primeCheckMap = {};       // 소수 체크 맵
    let clickedNumbers = new Set(); // 클릭된 숫자들

    // 시작화면 강제 표시
    startScreen.style.display = 'flex';
    startScreen.classList.add('active');

    // 시작화면 -> 설정화면
    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        settingsScreen.classList.add('active');
    });

    // 설정화면 -> 게임화면
    startGameButton.addEventListener('click', () => {
        if (!validateInputs()) return;

        // 게임 설정 저장
        gridSize = parseInt(gameModeSelect.value);
        timeLimit = parseInt(timeLimitSelect.value);
        heartCount = parseInt(heartCountSelect.value);
        numberRangeStart = parseInt(rangeStartInput.value);
        numberRangeEnd = parseInt(rangeEndInput.value);

        initGame();
        settingsScreen.classList.remove('active');
        gameScreen.classList.add('active');
    });

    // 게임오버 -> 설정화면
    restartButton.addEventListener('click', () => {
        gameoverScreen.classList.remove('active');
        settingsScreen.classList.add('active');
        stopTimer();
    });

    // 더이상 소수없음 버튼 클릭
    noMorePrimesBtn.addEventListener('click', () => {
        if (!hasPrimeInBoard()) {   // 소수가 없으면
            currentScore += 30;      // 30점 추가
            scoreDisplay.textContent = currentScore;
            currentStage++;         // 스테이지 증가
            resetBoard();          // 보드 재설정
        } else {
            loseHeart();          // 하트 감소
        }
        resetTimer();
    });

    // 입력값 검증
    function validateInputs() {
        const start = parseInt(rangeStartInput.value);
        const end = parseInt(rangeEndInput.value);
        
        if (isNaN(start) || isNaN(end) || start >= end) {
            alert('올바른 숫자 범위를 입력해주세요.');
            return false;
        }

        // 최소 필요 숫자 개수 체크
        let count = 0;
        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) count++;
            if (count >= gridSize * gridSize) return true;
        }
        
        alert('선택한 범위가 너무 좁습니다. 더 큰 범위를 선택해주세요.');
        return false;
    }

    // 게임 초기화
    function initGame() {
        currentScore = 0;
        currentStage = 1;
        heartsRemaining = heartCount;
        clickedNumbers.clear();
        
        scoreDisplay.textContent = '0';
        initHearts();
        generateNumbersArray();
        createBoard();
        startTimer();
    }

    // 하트 초기화
    function initHearts() {
        heartsContainer.innerHTML = '❤️'.repeat(heartsRemaining);
    }

    // 게임판 재설정
    function resetBoard() {
        stopTimer();
        gameBoard.innerHTML = '';
        generateNumbersArray();
        createBoard();
        startTimer();
    }

    // 게임판에 표시될 숫자 생성
    function generateNumbersArray() {
        numbersArray = [];
        primeCheckMap = {};
        
        let candidates = [];
        for (let i = numberRangeStart; i <= numberRangeEnd; i++) {
            if (i % 2 === 0 || i % 5 === 0) continue;
            candidates.push(i);
        }

        shuffleArray(candidates);
        numbersArray = candidates.slice(0, gridSize * gridSize);

        numbersArray.forEach(num => {
            primeCheckMap[num] = isPrime(num);
        });
    }

    // 게임판 생성
    function createBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        
        numbersArray.forEach(number => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = number;
            cell.dataset.number = number;
            cell.addEventListener('click', onNumberClick);
            gameBoard.appendChild(cell);
        });
    }

    // 숫자 클릭 처리
    function onNumberClick(e) {
        const cell = e.target;
        const num = parseInt(cell.dataset.number);

        if (clickedNumbers.has(num)) return;
        clickedNumbers.add(num);

        if (primeCheckMap[num]) {         // 소수이면
            cell.style.backgroundColor = 'blue';
            currentScore += 10;
            scoreDisplay.textContent = currentScore;
        } else {                         // 합성수이면
            cell.style.backgroundColor = 'red';
            loseHeart();
        }
        resetTimer();
    }

    // 하트 감소
    function loseHeart() {
        heartsRemaining--;
        initHearts();
        if (heartsRemaining <= 0) {
            endGame();
        }
    }

    // 게임 종료
    function endGame() {
        stopTimer();
        saveHighScore(currentScore);
        gameScreen.classList.remove('active');
        gameoverScreen.classList.add('active');
        finalScoreDisplay.textContent = currentScore;
        displayHighScores();
    }

    // 타이머 시작
    function startTimer() {
        currentTime = timeLimit;
        timerContainer.textContent = `${currentTime}초`;
        timer = setInterval(() => {
            currentTime--;
            timerContainer.textContent = `${currentTime}초`;
            if (currentTime <= 0) {
                endGame();
            }
        }, 1000);
    }

    // 타이머 리셋
    function resetTimer() {
        stopTimer();
        startTimer();
    }

    // 타이머 중지
    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // 소수 판별
    function isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    // 게임판에 소수가 있는지 확인
    function hasPrimeInBoard() {
        for (let num of numbersArray) {
            if (primeCheckMap[num] && !clickedNumbers.has(num)) {
                return true;
            }
        }
        return false;
    }

    // 배열 섞기
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 최고점수 저장
    function saveHighScore(score) {
        try {
            if (!window.localStorage) return;
            
            let storedScores = [];
            const savedScores = localStorage.getItem('highScores');
            if (savedScores) {
                storedScores = JSON.parse(savedScores);
            }
            
            storedScores.push(score);
            storedScores.sort((a, b) => b - a);
            const top5 = storedScores.slice(0, 5);
            
            localStorage.setItem('highScores', JSON.stringify(top5));
        } catch (error) {
            console.log('Score saving failed:', error);
        }
    }

    // 최고점수 표시
    function displayHighScores() {
        try {
            if (!window.localStorage) return;
            
            const savedScores = localStorage.getItem('highScores');
            let storedScores = [];
            if (savedScores) {
                storedScores = JSON.parse(savedScores);
            }
            
            highScoresList.innerHTML = '';
            storedScores.forEach(score => {
                const li = document.createElement('li');
                li.textContent = score;
                highScoresList.appendChild(li);
            });
        } catch (error) {
            console.log('Score display failed:', error);
        }
    }
});