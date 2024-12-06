// 화면 전환을 위한 요소 선택
const startScreen = document.getElementById('start-screen');
const settingsScreen = document.getElementById('settings-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');

// 버튼 요소
const startButton = document.getElementById('start-button');
const startGameButton = document.getElementById('start-game-button');
const restartButton = document.getElementById('restart-button');
const noMorePrimesBtn = document.getElementById('no-more-primes-btn');

// 설정 요소
const gameModeSelect = document.getElementById('game-mode-select');
const timeLimitSelect = document.getElementById('time-limit-select');
const heartCountSelect = document.getElementById('heart-count-select');
const rangeStartInput = document.getElementById('range-start');
const rangeEndInput = document.getElementById('range-end');

// 게임 관련 요소
const gameBoard = document.getElementById('game-board');
const timerContainer = document.getElementById('timer-container');
const heartsContainer = document.getElementById('hearts-container');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoresList = document.getElementById('high-scores-list');

// 게임 상태 변수
let gridSize = 3;          // 3x3, 4x4, 5x5 모드
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
let highScores = [];

// 초기 화면에서 "게임시작" 버튼 클릭 시
startButton.addEventListener('click', () => {
    startScreen.classList.remove('active');
    settingsScreen.classList.add('active');
});

// "소수 전쟁 시작" 버튼 클릭 시
startGameButton.addEventListener('click', () => {
    // 설정값 읽어오기
    gridSize = parseInt(gameModeSelect.value);
    timeLimit = parseInt(timeLimitSelect.value);
    heartCount = parseInt(heartCountSelect.value);
    numberRangeStart = parseInt(rangeStartInput.value);
    numberRangeEnd = parseInt(rangeEndInput.value);

    // 게임 초기화
    initGame();

    settingsScreen.classList.remove('active');
    gameScreen.classList.add('active');
});

// "게임 다시하기" 버튼 클릭 시
restartButton.addEventListener('click', () => {
    gameoverScreen.classList.remove('active');
    settingsScreen.classList.add('active');
});

// "더이상 소수 없음" 버튼 클릭 시
noMorePrimesBtn.addEventListener('click', () => {
    if (!hasPrimeInBoard()) {
        // 보드 내 소수가 없으므로 점수 +30
        currentScore += 30;
        scoreDisplay.textContent = currentScore;
        // 스테이지 진행
        currentStage++;
        // 새로운 숫자 세팅
        resetBoard();
    } else {
        // 사실 소수가 남아있는데 "더이상 소수없음"을 누른 경우 패널티?
        // 여기서는 패널티 없이 넘어가지만 필요시 구현
    }
});

// 게임 초기화 로직
function initGame() {
    currentScore = 0;
    currentStage = 1;
    heartsRemaining = heartCount;
    scoreDisplay.textContent = currentScore;
    initHearts();
    resetBoard();
    startTimer();
}

// 하트 초기화
function initHearts() {
    heartsContainer.innerHTML = '';
    for (let i = 0; i < heartsRemaining; i++) {
        const heart = document.createElement('span');
        heart.textContent = '❤️';
        heartsContainer.appendChild(heart);
    }
}

// 보드 리셋
function resetBoard() {
    gameBoard.innerHTML = '';
    generateNumbersArray();
    createBoard();
    // 다시 시간 카운트를 초기화
    resetTimer();
}

// 숫자 생성 (2의 배수, 5의 배수는 제외)
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

    // gridSize*gridSize 만큼 랜덤 추출
    shuffleArray(candidates);
    numbersArray = candidates.slice(0, gridSize * gridSize);

    // 미리 소수 체크
    for (let num of numbersArray) {
        primeCheckMap[num] = isPrime(num);
    }
}

// 보드 생성
function createBoard() {
    const boardSize = gridSize * gridSize;
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    
    for (let i = 0; i < boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.textContent = numbersArray[i];
        cell.dataset.number = numbersArray[i];
        cell.addEventListener('click', onNumberClick);
        gameBoard.appendChild(cell);
    }
}

// 숫자 클릭 이벤트
function onNumberClick(e) {
    const cell = e.target;
    const num = parseInt(cell.dataset.number, 10);

    if (clickedNumbers.has(num)) {
        return; // 이미 클릭한 숫자는 무시
    }
    clickedNumbers.add(num);

    if (primeCheckMap[num]) {
        // 소수일 경우
        cell.style.backgroundColor = 'blue';
        currentScore += 10;
        scoreDisplay.textContent = currentScore;
    } else {
        // 합성수일 경우
        cell.style.backgroundColor = 'red';
        loseHeart();
    }
    // 클릭 시 타이머 리셋
    resetTimer();
}

// 하트 감소
function loseHeart() {
    heartsRemaining -= 1;
    initHearts();
    if (heartsRemaining <= 0) {
        endGame();
    }
}

// 게임 종료
function endGame() {
    stopTimer();
    gameScreen.classList.remove('active');
    gameoverScreen.classList.add('active');
    finalScoreDisplay.textContent = currentScore;
    saveHighScore(currentScore);
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
            // 시간 초과
            endGame();
        }
    }, 1000);
}

// 타이머 리셋 (버튼 클릭시 다시 카운트 시작)
function resetTimer() {
    stopTimer();
    currentTime = timeLimit;
    timerContainer.textContent = `${currentTime}초`;
    timer = setInterval(() => {
        currentTime--;
        timerContainer.textContent = `${currentTime}초`;
        if (currentTime <= 0) {
            // 시간 초과
            endGame();
        }
    }, 1000);
}

// 타이머 종료
function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// 소수 판별 함수 (간단한 방식)
function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// 보드에 소수 존재 여부 체크
function hasPrimeInBoard() {
    for (let num of numbersArray) {
        if (primeCheckMap[num] && !clickedNumbers.has(num)) {
            return true;
        }
    }
    return false;
}

// 배열 셔플
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 하이스코어 저장
function saveHighScore(score) {
    const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
    storedScores.push(score);
    storedScores.sort((a, b) => b - a);
    const top5 = storedScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(top5));
}

// 하이스코어 표시
function displayHighScores() {
    const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScoresList.innerHTML = '';
    for (let s of storedScores) {
        const li = document.createElement('li');
        li.textContent = s;
        highScoresList.appendChild(li);
    }
}