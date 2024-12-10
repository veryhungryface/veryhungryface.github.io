document.addEventListener('DOMContentLoaded', () => {

    // 서버 URL 설정
    const API_URL = 'http://107.172.92.109:8080/api';


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

    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 모든 버튼에서 selected 클래스 제거
            modeButtons.forEach(b => b.classList.remove('selected'));
            // 클릭된 버튼에 selected 클래스 추가
            btn.classList.add('selected');
            // 해당 모드의 점수 표시
            displayHighScores(btn.dataset.mode);
        });
    });

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
                gameState.hearts--;
                resetTimer();
                updateUI(); // UI 업데이트
                if (gameState.hearts <= 0) {
                    endGame(); // 하트가 0개일 때 게임 종료
                }
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
        // saveHighScore(gameState.score) 제거하고 새로운 함수로 대체
        checkAndSaveHighScore(gameState.score);
        showScreen('gameover'); // showGameOverScreen() 대신 showScreen('gameover') 사용
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

 
    async function handleGameOver() {
        const finalScore = parseInt(document.getElementById('score').text);
        await checkAndSaveHighScore(finalScore);
        showGameOverScreen();
    }

    async function checkAndSaveHighScore(score) {
        try {
            const gameInfo = {
                score: score,
                mode: `${gameState.mode}x${gameState.mode}`,
                timeLimit: gameState.timeLimit,
                hearts: gameState.initialHearts,
                range: `${settings.rangeStartSelect.value}~${settings.rangeEndSelect.value}`,
            };
    
            const checkResponse = await fetch(`${API_URL}/scores/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameInfo)
            });
    
            if (!checkResponse.ok) {
                throw new Error('서버 응답 오류');
            }
    
            const checkResult = await checkResponse.json();
    
            if (checkResult.isTopScore) {
                const name = await showNameInputDialog(score);
                if (name) {
                    // 여기서 range 값을 올바르게 설정
                    await saveScore({
                        ...gameInfo,
                        name: name
                    });
                }
            }
    
            await displayHighScores();
        } catch (error) {
            console.error('점수 처리 실패:', error);
        }
    }

    function showNameInputDialog(score) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'name-input-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h2>축하합니다!</h2>
                    <p>점수 ${score}점으로 TOP 10에 진입했습니다!</p>
                    <input type="text" 
                        id="playerName" 
                        placeholder="이름을 입력하세요 (최대 4글자)" 
                        maxlength="4">
                    <button id="submit-name">확인</button>
                </div>
            `;
    
            document.body.appendChild(dialog);
    
            const submitButton = dialog.querySelector('#submit-name');
            const nameInput = dialog.querySelector('#playerName');
    
            // 입력 시 실시간으로 길이 체크
            nameInput.addEventListener('input', () => {
                if (nameInput.value.length > 4) {
                    nameInput.value = nameInput.value.slice(0, 4);
                }
            });
    
            submitButton.addEventListener('click', () => {
                const name = nameInput.value.trim();
                if (name) {
                    if (name.length > 4) {
                        alert('이름은 최대 4글자까지만 가능합니다.');
                        return;
                    }
                    document.body.removeChild(dialog);
                    resolve(name);
                } else {
                    alert('이름을 입력해주세요!');
                }
            });
    
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitButton.click();
                }
            });
        });
    }

    async function saveScore(scoreData) {
        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            });

            if (!response.ok) {
                throw new Error('점수 저장 실패');
            }
        } catch (error) {
            console.error('점수 저장 오류:', error);
        }
    }

    async function displayHighScores(specificMode = null) {
        try {
            const highScoresList = document.getElementById('high-scores-list');
            
            // 표시할 모드 결정
            const displayMode = specificMode || `${gameState.mode}x${gameState.mode}`;
            
            // 버튼 상태 업데이트
            const buttons = document.querySelectorAll('.mode-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.mode === displayMode);
            });
    
            // 해당 모드의 점수 가져오기
            const response = await fetch(`${API_URL}/scores/top10/${displayMode}`);
            
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            
            const scores = await response.json();
    
            if (scores.length === 0) {
                highScoresList.innerHTML = '<li class="no-scores">기록이 없습니다</li>';
                return;
            }
    
            const html = scores.map((info, index) => `
                <li class="high-score-item">
                    <div class="score-header">
                        <span class="rank">Top ${index + 1}</span>
                        <span class="score">${info.score}</span>
                        <span class="name">${info.name}</span>
                    </div>
                    <div class="score-details">
                        <span class="mode" style="color: #4CAF50;">${info.mode}</span> |
                        <span class="range">🎯 ${info.range}</span> |
                        <span class="time">⏱️${info.timeLimit}초</span> |
                        <span class="hearts" style="font-size: 0.9em;">❤️${info.hearts}</span>
                    </div>
                </li>
            `).join('');
    
            highScoresList.innerHTML = html;
        } catch (error) {
            console.error('점수 표시 실패:', error);
            highScoresList.innerHTML = '<li class="error">점수를 불러올 수 없습니다</li>';
        }
    }
    
    // 추가 CSS 스타일
    const style = document.createElement('style');
    style.textContent = `
        .mode-title {
            color: white;
            text-align: center;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
    `;
    document.head.appendChild(style);

    // 게임 오버 시 호출되는 함수 수정
    function showGameOverScreen() {
        hideAllScreens();
        document.getElementById('gameover-screen').style.display = 'flex';
        document.getElementById('final-score').textContent = score;
        displayHighScores();
    }

    buttons.clearRecords.addEventListener('click', () => {
        console.log('Clear Records button clicked');
        
        // 이미 존재하는 다이얼로그 제거
        const existingDialog = document.getElementById('password-dialog');
        if (existingDialog) existingDialog.remove();
        const existingConfirm = document.getElementById('confirm-dialog');
        if (existingConfirm) existingConfirm.remove();
    
        // 비밀번호 다이얼로그 생성
        const passwordDialog = document.createElement('div');
        passwordDialog.id = 'password-dialog';
        passwordDialog.className = 'password-dialog';
        passwordDialog.innerHTML = `
            <div class="dialog-content">
                <h3>비밀번호 입력</h3>
                <input type="password" id="password-input" placeholder="비밀번호를 입력하세요">
                <div class="button-group">
                    <button id="submit-password">확인</button>
                    <button id="cancel-password">취소</button>
                </div>
            </div>
        `;
    
        // 확인 다이얼로그 생성
        const confirmDialog = document.createElement('div');
        confirmDialog.id = 'confirm-dialog';
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.style.display = 'none';
        confirmDialog.innerHTML = `
            <div class="dialog-content">
                <h3>확인</h3>
                <p>정말 모든 기록을 초기화하시겠습니까?</p>
                <div class="button-group">
                    <button id="confirm-yes">예</button>
                    <button id="confirm-no">아니오</button>
                </div>
            </div>
        `;
    
        // 다이얼로그를 페이지에 추가
        document.body.appendChild(passwordDialog);
        document.body.appendChild(confirmDialog);
    
        const passwordInput = document.getElementById('password-input');
    
        // 비밀번호 확인 함수
        const checkPassword = async () => {
            const password = passwordInput.value;
            if (password === '5082') {
                passwordDialog.style.display = 'none';
                confirmDialog.style.display = 'flex';
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = '비밀번호가 올바르지 않습니다.';
                passwordDialog.querySelector('.dialog-content').appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 2000);
            }
        };
    
        // 기록 초기화 실행 함수
        const deleteRecords = async () => {
            try {
                const response = await fetch(`${API_URL}/scores`, {
                    method: 'DELETE'
                });
    
                if (response.ok) {
                    confirmDialog.style.display = 'none';
                    passwordDialog.remove();
                    confirmDialog.remove();
                    displayHighScores();
                    const successDiv = document.createElement('div');
                    successDiv.className = 'success-message';
                    successDiv.textContent = '기록이 초기화되었습니다.';
                    document.body.appendChild(successDiv);
                    setTimeout(() => successDiv.remove(), 2000);
                }
            } catch (error) {
                console.error('기록 초기화 실패:', error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = '기록 초기화에 실패했습니다.';
                confirmDialog.querySelector('.dialog-content').appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 2000);
            }
        };
    
        // 이벤트 리스너 설정
        document.getElementById('submit-password').addEventListener('click', checkPassword);
        document.getElementById('cancel-password').addEventListener('click', () => {
            passwordDialog.remove();
            confirmDialog.remove();
        });
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    
        document.getElementById('confirm-yes').addEventListener('click', deleteRecords);
        document.getElementById('confirm-no').addEventListener('click', () => {
            confirmDialog.style.display = 'none';
            passwordDialog.remove();
            confirmDialog.remove();
        });
    });
});
