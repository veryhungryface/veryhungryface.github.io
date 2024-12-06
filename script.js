네, 완성된 script.js 파일을 공유해드리겠습니다:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 화면 요소 참조
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

    // 게임 상태 변수
    let gridSize = 3;
    let timeLimit = 40;
    let heartCount = 2;
    let numberRangeStart = 1;
    let numberRangeEnd = 50;
    let timer;
    let currentTime;
    let currentScore = 0;
    let currentStage = 1;
    let heartsRemaining = 2;
    let numbersArray = [];
    let primeCheckMap = {};
    let clickedNumbers = new Set();
    let gameActive = false;

    // 이벤트 리스너 설정
    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        settingsScreen.classList.add('active');
    });

    startGameButton.addEventListener('click', () => {
        const start = parseInt(rangeStartInput.value);
        const end = parseInt(rangeEndInput.value);
        
        if (isNaN(start) || isNaN(end) || start >= end) {
            alert('올바른 숫자 범위를 입력해주세요.');
            return;
        }

        gridSize = parseInt(gameModeSelect.value);
        timeLimit = parseInt(timeLimitSelect.value);
        heartCount = parseInt(heartCountSelect.value);
        numberRangeStart = start;
        numberRangeEnd = end;

        initGame();
        settingsScreen.classList.remove('active');
        gameScreen.classList.add('active');
    });

    restartButton.addEventListener('click', () => {
        gameoverScreen.classList.remove('active');
        settingsScreen.classList.add('active');
        stopTimer();
    });

    noMorePrimesBtn.addEventListener('click', () => {
        if (!gameActive) return;
        
        if (!hasPrimeInBoard()) {
            currentScore += 30;
            scoreDisplay.textContent = currentScore;
            currentStage++;
            resetBoard();
        } else {
            loseHeart();
        }
    });

    function initGame() {
        gameActive = true;
        currentScore = 0;
        currentStage = 1;
        heartsRemaining = heartCount;
        clickedNumbers.clear();
        
        scoreDisplay.textContent = currentScore;
        initHearts();
        resetBoard();
    }

    function resetBoard() {
        stopTimer();
        gameBoard.innerHTML = '';
        generateNumbersArray();
        createBoard();
        startTimer();
    }

    function generateNumbersArray() {
        numbersArray = [];
        primeCheckMap = {};
        
        let candidates = [];
        for (let i = numberRangeStart; i <= numberRangeEnd; i++) {
            if ((i % 2 === 0 && i !== 2) || (i % 5 === 0 && i !== 5)) continue;
            candidates.push(i);
        }

        if (candidates.length < gridSize * gridSize) {
            alert('선택한 범위가 너무 좁습니다. 더 큰 범위를 선택해주세요.');
            return;
        }

        shuffleArray(candidates);
        numbersArray = candidates.slice(0, gridSize * gridSize);

        numbersArray.forEach(num => {
            primeCheckMap[num] = isPrime(num);
        });
    }

    function createBoard() {
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = numbersArray[i];
            cell.dataset.number = numbersArray[i];
            cell.addEventListener('click', onNumberClick);
            gameBoard.appendChild(cell);
        }
    }

    function onNumberClick(e) {
        if (!gameActive) return;
        
        const cell = e.target;
        const num = parseInt(cell.dataset.number, 10);

        if (clickedNumbers.has(num)) return;
        clickedNumbers.add(num);

        if (primeCheckMap[num]) {
            cell.style.backgroundColor = '#0066cc'; // 파란색
            currentScore += 10;
            scoreDisplay.textContent = currentScore;
        } else {
            cell.style.backgroundColor = '#cc0000'; // 빨간색
            loseHeart();
        }
        
        resetTimer();
    }

    function initHearts() {
        heartsContainer.innerHTML = '❤️'.repeat(heartsRemaining);
    }

    function loseHeart() {
        heartsRemaining--;
        initHearts();
        if (heartsRemaining <= 0) {
            endGame();
        }
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
        startTimer();
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function endGame() {
        gameActive = false;
        stopTimer();
        saveHighScore(currentScore);
        displayHighScores();
        
        gameScreen.classList.remove('active');
        gameoverScreen.classList.add('active');
        finalScoreDisplay.textContent = currentScore;
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
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function saveHighScore(score) {
        try {
            const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
            storedScores.push(score);
            storedScores.sort((a, b) => b - a);
            const top5 = storedScores.slice(0, 5);
            localStorage.setItem('highScores', JSON.stringify(top5));
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    function displayHighScores() {
        try {
            const storedScores = JSON.parse(localStorage.getItem('highScores')) || [];
            highScoresList.innerHTML = '';
            storedScores.forEach(score => {
                const li = document.createElement('li');
                li.textContent = score;
                highScoresList.appendChild(li);
            });
        } catch (error) {
            console.error('Error displaying scores:', error);
        }
    }
});
```

주요 변경 및 개선사항:

1. 게임 활성화 상태 추적을 위한 `gameActive` 변수 추가
2. 타이머 관리 개선
3. 에러 처리 추가 (특히 로컬 스토리지 관련)
4. 숫자 범위 검증 강화
5. 게임 상태 초기화 로직 개선
6. 이벤트 리스너 중복 방지
7. 색상 값을 더 명확한 값으로 변경
8. 소수 판별 결과 캐싱
9. 게임 종료 조건 명확화

이제 게임이 처음부터 제대로 시작되고, 모든 기능이 의도한 대로 작동할 것입니다. 실행해보시고 문제가 있다면 알려주세요!​​​​​​​​​​​​​​​​