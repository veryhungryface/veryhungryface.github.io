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
    let gridSize = 3;
    let timeLimit = 20;
    let heartCount = 1;
    let numberRangeStart = 1;
    let numberRangeEnd = 50;
    let timer;
    let currentTime;
    let currentScore = 0;
    let currentStage = 1;
    let heartsRemaining = 1;
    let numbersArray = [];
    let primeCheckMap = {};
    let clickedNumbers = new Set();

    // 시작화면 -> 설정화면
    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        settingsScreen.classList.add('active');
    });

    // 설정화면 -> 게임화면
    startGameButton.addEventListener('click', () => {
        gridSize = parseInt(gameModeSelect.value);
        timeLimit = parseInt(timeLimitSelect.value);
        heartCount = parseInt(heartCountSelect.value);
        numberRangeStart = parseInt(rangeStartInput.value);
        numberRangeEnd = parseInt(rangeEndInput.value);

        initGame();
        settingsScreen.classList.remove('active');
        gameScreen.classList.add('active');
    });

    // 게임 오버화면 -> 설정화면
    restartButton && restartButton.addEventListener('click', () => {
        gameoverScreen.classList.remove('active');
        settingsScreen.classList.add('active');
    });

    // 더이상 소수 없음 버튼
    noMorePrimesBtn.addEventListener('click', () => {
        if (!hasPrimeInBoard()) {
            currentScore += 30;
            scoreDisplay.textContent = currentScore;
            currentStage++;
            resetBoard();
        } else {
            // 여기에 필요하면 패널티 로직 추가 가능
        }
    });

    function initGame() {
        currentScore = 0;
        currentStage = 1;
        heartsRemaining = heartCount;
        scoreDisplay.textContent = currentScore;
        initHearts();
        resetBoard();
        startTimer();
    }

    function initHearts() {
        heartsContainer.innerHTML = '';
        for (let i = 0; i < heartsRemaining; i++) {
            const heart = document.createElement('span');
            heart.textContent = '❤️';
            heartsContainer.appendChild(heart);
        }
    }

    function resetBoard() {
        gameBoard.innerHTML = '';
        generateNumbersArray();
        createBoard();
        resetTimer();
    }

    function generateNumbersArray() {
        numbersArray = [];
        primeCheckMap = {};
        clickedNumbers.clear();

        let candidates = [];
        for (let i = numberRangeStart; i <= numberRangeEnd; i++) {
            // 2의 배수, 5의 배수 제외
            if (i % 2 === 0 || i % 5 === 0) continue;
            candidates.push(i);
        }

        shuffleArray(candidates);
        numbersArray = candidates.slice(0, gridSize * gridSize);

        for (let num of numbersArray) {
            primeCheckMap[num] = isPrime(num);
        }
    }

    function createBoard() {
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        const boardSize = gridSize * gridSize;
        for (let i = 0; i < boardSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = numbersArray[i];
            cell.dataset.number = numbersArray[i];
            cell.addEventListener('click', onNumberClick);
            gameBoard.appendChild(cell);
        }
    }

    function onNumberClick(e) {
        const cell = e.target;
        const num = parseInt(cell.dataset.number, 10);

        if (clickedNumbers.has(num)) return;
        clickedNumbers.add(num);

        if (primeCheckMap[num]) {
            cell.style.backgroundColor = 'blue';
            currentScore += 10;
            scoreDisplay.textContent = currentScore;
        } else {
            cell.style.backgroundColor = 'red';
            loseHeart();
        }
        resetTimer();
    }

    function loseHeart() {
        heartsRemaining -= 1;
        initHearts();
        if (heartsRemaining <= 0) {
            endGame();
        }
    }

    function endGame() {
        stopTimer();
        gameScreen.classList.remove('active');
        gameoverScreen.classList.add('active');
        finalScoreDisplay.textContent = currentScore;
        saveHighScore(currentScore);
        displayHighScores();
    }

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

    function resetTimer() {
        stopTimer();
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

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    function hasPrimeInBoard() {
        for (let num of numbersArray) {
            if (primeCheckMap[num] && !clickedNumbers.has(num)) {
                return true;
            }
        }
        return false;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function saveHighScore(score) {
        const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
        storedScores.push(score);
        storedScores.sort((a, b) => b - a);
        const top5 = storedScores.slice(0, 5);
        localStorage.setItem('highScores', JSON.stringify(top5));
    }

    function displayHighScores() {
        const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScoresList.innerHTML = '';
        for (let s of storedScores) {
            const li = document.createElement('li');
            li.textContent = s;
            highScoresList.appendChild(li);
        }
    }
});