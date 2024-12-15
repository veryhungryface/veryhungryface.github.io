document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://107.172.92.109:8080/api';

    const screens = {
        start: document.getElementById('start-screen'),
        singleSettings: document.getElementById('single-settings-screen'),
        battleSettings: document.getElementById('battle-settings-screen'),
        game: document.getElementById('game-screen'),
        gameover: document.getElementById('gameover-screen')
    };

    const buttons = {
        singleMode: document.getElementById('single-mode-button'),
        battleMode: document.getElementById('battle-mode-button'),
        startSingleGame: document.getElementById('start-single-game-button'),
        startBattleGame: document.getElementById('start-battle-game-button'),
        noMorePrimes: document.getElementById('no-more-primes-btn'),
        restart: document.getElementById('restart-button'),
        adminMode: document.getElementById('admin-mode-button'),
        homeButton: document.getElementById('home-button')
        // clearRecords는 이제 사용하지 않으므로 제거
    };

    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            displayHighScores(btn.dataset.mode);
        });
    });

    const gameElements = {
        board: document.getElementById('game-board'),
        hearts: document.getElementById('hearts-container'),
        roundInfo: document.getElementById('round-info'),
        timer: document.getElementById('timer-container'),
        score: document.getElementById('score'),
        playerAScore: document.getElementById('player-a-score'),
        playerBScore: document.getElementById('player-b-score'),
        finalScore: document.getElementById('final-score'),
        battleResult: document.getElementById('battle-result'),
        highScores: document.getElementById('high-scores-list')
    };

    const singleSettings = {
        modeSelect: document.getElementById('single-game-mode-select'),
        timeSelect: document.getElementById('single-time-limit-select'),
        heartSelect: document.getElementById('heart-count-select'),
        rangeStartSelect: document.getElementById('single-range-start-select'),
        rangeEndSelect: document.getElementById('single-range-end-select')
    };

    const battleSettings = {
        modeSelect: document.getElementById('battle-game-mode-select'),
        timeSelect: document.getElementById('battle-time-limit-select'),
        roundSelect: document.getElementById('round-count-select'),
        rangeStartSelect: document.getElementById('battle-range-start-select'),
        rangeEndSelect: document.getElementById('battle-range-end-select')
    };

    let gameState = {
        mode: 'single',
        active: false,
        boardSize: 3,
        timeLimit: 40,
        hearts: 2,
        rounds: 3,
        currentRound: 1,
        currentPlayer: 'A',
        score: 0,
        playerAScore: 0,
        playerBScore: 0,
        stage: 1,
        timer: null,
        timeLeft: 40,
        numbers: [],
        primeMap: {},
        clicked: new Set()
    };

    initializeEventListeners();
    initRangeSelects();
    showScreen('start');

    function initializeEventListeners() {
        buttons.singleMode.addEventListener('click', () => {
            gameState.mode = 'single';
            showScreen('singleSettings');
        });

        buttons.battleMode.addEventListener('click', () => {
            gameState.mode = 'battle';
            showScreen('battleSettings');
        });

        buttons.startSingleGame.addEventListener('click', () => handleGameStart('single'));
        buttons.startBattleGame.addEventListener('click', () => handleGameStart('battle'));
        buttons.noMorePrimes.addEventListener('click', handleNoMorePrimes);
        buttons.restart.addEventListener('click', () => showScreen(gameState.mode === 'single' ? 'singleSettings' : 'battleSettings'));

        // clearRecords는 더이상 사용하지 않으므로 제거
        // buttons.clearRecords.addEventListener('click', handleClearRecords);

        singleSettings.rangeStartSelect.addEventListener('change', () => {
            populateEndOptions(parseInt(singleSettings.rangeStartSelect.value), singleSettings.rangeEndSelect);
        });

        battleSettings.rangeStartSelect.addEventListener('change', () => {
            populateEndOptions(parseInt(battleSettings.rangeStartSelect.value), battleSettings.rangeEndSelect);
        });

        buttons.adminMode.addEventListener('click', handleClearRecords);
        buttons.homeButton.addEventListener('click', () => {
            showScreen('start');
        }); // 여기서 괄호를 제대로 닫아줌
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        screens[screenName].classList.add('active');
        screens[screenName].style.display = 'flex';

        if (screenName === 'start') {
            resetGameState();
        }
    }

    function initRangeSelects() {
        [singleSettings, battleSettings].forEach(settings => {
            for (let i = 0; i <= 1000; i += 100) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                settings.rangeStartSelect.appendChild(option);
            }
            populateEndOptions(0, settings.rangeEndSelect);
        });
    }

    function populateEndOptions(startVal, endSelect) {
        endSelect.innerHTML = '';
        for (let j = 100; j <= 1000; j += 100) {
            const endVal = startVal + j;
            const option = document.createElement('option');
            option.value = endVal;
            option.textContent = endVal;
            endSelect.appendChild(option);
        }
    }

    function handleGameStart(mode) {
        const settings = mode === 'single' ? singleSettings : battleSettings;
        if (!validateSettings(settings)) return;

        gameState = {
            ...gameState,
            mode: mode,
            active: true,
            boardSize: parseInt(settings.modeSelect.value),
            timeLimit: parseInt(settings.timeSelect.value),
            hearts: mode === 'single' ? parseInt(singleSettings.heartSelect.value) : null,
            rounds: mode === 'battle' ? parseInt(battleSettings.roundSelect.value) : null,
            currentRound: 1,
            currentPlayer: 'A',
            score: 0,
            playerAScore: 0,
            playerBScore: 0,
            timeLeft: parseInt(settings.timeSelect.value),
            numbers: [],
            primeMap: {},
            clicked: new Set()
        };

        initGame();
        showScreen('game');
        updateGameUI();
    }

    function validateSettings(settings) {
        const start = parseInt(settings.rangeStartSelect.value);
        const end = parseInt(settings.rangeEndSelect.value);

        if (isNaN(start) || isNaN(end) || start >= end) {
            alert('올바른 숫자 범위를 선택해주세요.');
            return false;
        }

        let count = 0;
        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) count++;
            if (count >= gameState.boardSize * gameState.boardSize) return true;
        }
        
        alert('선택한 범위가 너무 좁습니다. 더 큰 범위를 선택해주세요.');
        return false;
    }

    function initGame() {
        resetGameState();
        gameState.active = true;
        generateNumbers();
        createBoard();
        updateGameUI();
        startTimer();
    }

    function resetGameState() {
        if (gameState.timer) clearInterval(gameState.timer);
        
        const settings = gameState.mode === 'single' ? singleSettings : battleSettings;
        gameState = {
            ...gameState,
            active: false,
            boardSize: parseInt(settings.modeSelect.value),
            timeLimit: parseInt(settings.timeSelect.value),
            hearts: gameState.mode === 'single' ? parseInt(singleSettings.heartSelect.value) : null,
            rounds: gameState.mode === 'battle' ? parseInt(battleSettings.roundSelect.value) : null,
            score: 0,
            playerAScore: 0,
            playerBScore: 0,
            currentRound: 1,
            stage: 1,
            timer: null,
            timeLeft: parseInt(settings.timeSelect.value),
            numbers: [],
            primeMap: {},
            clicked: new Set()
        };
    }
    
    function generateNumbers() {
        const settings = gameState.mode === 'single' ? singleSettings : battleSettings;
        const start = parseInt(settings.rangeStartSelect.value);
        const end = parseInt(settings.rangeEndSelect.value);
        let candidates = [];

        for (let i = start; i <= end; i++) {
            if (i % 2 !== 0 && i % 5 !== 0) {
                candidates.push(i);
            }
        }

        shuffleArray(candidates);
        gameState.numbers = candidates.slice(0, gameState.boardSize * gameState.boardSize);

        gameState.numbers.forEach(num => {
            gameState.primeMap[num] = isPrime(num);
        });
    }

    function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${gameState.boardSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gameState.boardSize}, 1fr)`;

    gameState.numbers.forEach(num => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = num;

        // 이벤트 리스너 추가
        cell.addEventListener('click', () => handleCellClick(cell, num));

        board.appendChild(cell);
    });

    if (gameState.mode === 'battle') {
        board.classList.remove('player-a-turn', 'player-b-turn');
        board.classList.add(`player-${gameState.currentPlayer.toLowerCase()}-turn`);
    }

    requestAnimationFrame(() => {
        adjustFontSizes();
    });
}

function adjustFontSizes() {
    const board = document.getElementById('game-board');
    const cells = board.querySelectorAll('.cell');

    let minFontSize = Infinity;

    // 1차 순회: 각 셀별 폰트 크기 계산 후 최소값 찾기
    cells.forEach(cell => {
        const text = cell.textContent.trim();
        const digitCount = text.length;
        const cellWidth = cell.offsetWidth;

        // 자릿수에 맞는 폰트 크기 계산
        const fontSize = Math.floor((cellWidth / digitCount) * 0.8);
        if (fontSize < minFontSize) {
            minFontSize = fontSize;
        }
    });

    // 모든 셀에 최소 폰트 크기 적용
    cells.forEach(cell => {
        cell.style.fontSize = minFontSize + 'px';
    });
}

    function handleCellClick(cell, num) {
        if (!gameState.active || gameState.clicked.has(num)) return;
        
        gameState.clicked.add(num);
        
        if (gameState.primeMap[num]) {
            cell.style.backgroundColor = '#0066cc';
            if (gameState.mode === 'single') {
                gameState.score += 10;
            } else {
                if (gameState.currentPlayer === 'A') {
                    gameState.playerAScore += 10;
                } else {
                    gameState.playerBScore += 10;
                }
            }
            cell.classList.add('found-prime');
        } else {
            cell.style.backgroundColor = '#cc0000';
            if (gameState.mode === 'single') {
                gameState.hearts--;
                if (gameState.hearts <= 0) {
                    endGame();
                    return; // endGame 호출 후 함수 종료
                }
            } else {
                switchPlayer();
            }
        }
        
        updateGameUI();
        resetTimer();
        
        const totalCells = gameState.boardSize * gameState.boardSize;
        const allClicked = (gameState.clicked.size === totalCells);
        const unclickedPrimes = gameState.numbers.filter(n => gameState.primeMap[n] && !gameState.clicked.has(n));

        if (allClicked) {
            setTimeout(() => {
                handleNoMorePrimes();
            }, 1000); 
        }
    }

    function switchPlayer() {
        gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
        const board = document.getElementById('game-board');
        board.classList.remove('player-a-turn', 'player-b-turn');
        board.classList.add(`player-${gameState.currentPlayer.toLowerCase()}-turn`);
        updateGameUI();
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
            if (gameState.mode === 'single') {
                gameState.score += 30;
                nextRound();
            } else {
                if (gameState.currentPlayer === 'A') {
                    gameState.playerAScore += 30;
                } else {
                    gameState.playerBScore += 30;
                }
                
                if (gameState.currentRound < gameState.rounds) {
                    gameState.currentRound++;
                    nextRound();
                } else {
                    endGame();
                }
            }
        } else {
            if (gameState.mode === 'single') {
                gameState.hearts--;
                if (gameState.hearts <= 0) {
                    endGame();
                    return; // endGame 호출 후 함수 종료
                 }
            } else {
                switchPlayer();
            }
        }
        
        updateGameUI();
    }

    function nextRound() {
        gameState.clicked.clear();
        generateNumbers();
        createBoard();
        updateGameUI();
        resetTimer();
    }

    function updateGameUI() {
        if (gameState.mode === 'single') {
            gameElements.hearts.style.display = 'block';
            gameElements.roundInfo.style.display = 'none';
            gameElements.playerAScore.style.display = 'none';
            gameElements.playerBScore.style.display = 'none';
            gameElements.hearts.textContent = '❤️'.repeat(gameState.hearts);
        } else {
            gameElements.hearts.style.display = 'none';
            gameElements.roundInfo.style.display = 'block';
            gameElements.playerAScore.style.display = 'block';
            gameElements.playerBScore.style.display = 'block';
            gameElements.roundInfo.textContent = `Round ${gameState.currentRound}/${gameState.rounds}`;
            
            gameElements.playerAScore.textContent = `RED: ${gameState.playerAScore}`;
            gameElements.playerBScore.textContent = `BLUE: ${gameState.playerBScore}`;
            
            const board = document.getElementById('game-board');
            board.classList.remove('player-a-turn', 'player-b-turn');
            board.classList.add(`player-${gameState.currentPlayer.toLowerCase()}-turn`);
        }

        gameElements.timer.textContent = `${gameState.timeLeft}초`;
    }
    
    function startTimer() {
        gameState.timeLeft = gameState.timeLimit;
        updateGameUI();
        
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            updateGameUI();
            
            if (gameState.timeLeft <= 0) {
                if (gameState.mode === 'single') {
                    gameState.hearts--;
                    if (gameState.hearts <= 0) {
                        endGame();
                    } else {
                        resetTimer();
                    }
                } else {
                    switchPlayer();
                    resetTimer();
                }
                updateGameUI();
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
        
        const finalScoreContainer = gameElements.finalScore.parentNode;

        if (gameState.mode === 'single') {
            if (finalScoreContainer.childNodes[0]) {
                finalScoreContainer.childNodes[0].textContent = 'SCORE: ';
            } else {
                finalScoreContainer.insertBefore(document.createTextNode('SCORE: '), gameElements.finalScore);
            }
            
            gameElements.finalScore.textContent = gameState.score;
            checkAndSaveHighScore(gameState.score);
        } else {
            if (finalScoreContainer.childNodes[0]) {
                finalScoreContainer.childNodes[0].textContent = '';
            }

            let resultText;
            if (gameState.playerAScore > gameState.playerBScore) {
                resultText = "RED Wins!";
            } else if (gameState.playerBScore > gameState.playerAScore) {
                resultText = "BLUE Wins!";
            } else {
                resultText = "Draw!";
            }

            const battleResult = document.getElementById('battle-result');
            battleResult.textContent = resultText;
            battleResult.className = 'battle-result ' + 
                (resultText === "Draw!" ? 'draw' : 'winner');

            gameElements.finalScore.textContent = `RED: ${gameState.playerAScore} BLUE: ${gameState.playerBScore}`;
        }
        
        showScreen('gameover');
    }

    async function checkAndSaveHighScore(score) {
        try {
            const settings = gameState.mode === 'single' ? singleSettings : battleSettings;
            const gameInfo = {
                score: score,
                mode: `${gameState.boardSize}x${gameState.boardSize}`,
                timeLimit: gameState.timeLimit,
                hearts: gameState.hearts,
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
                    await saveScore({
                        ...gameInfo,
                        name: name
                    });
                }
            }
    
            await displayHighScores(`${gameState.boardSize}x${gameState.boardSize}`);
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
            
            const displayMode = specificMode || `${gameState.boardSize}x${gameState.boardSize}`;
            
            const btns = document.querySelectorAll('.mode-btn');
            btns.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.mode === displayMode);
            });
    
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

    function handleClearRecords() {
        console.log('Clear Records button clicked');
        
        const existingDialog = document.getElementById('password-dialog');
        if (existingDialog) existingDialog.remove();
        const existingConfirm = document.getElementById('confirm-dialog');
        if (existingConfirm) existingConfirm.remove();
    
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
    
        document.body.appendChild(passwordDialog);
        document.body.appendChild(confirmDialog);
    
        const passwordInput = document.getElementById('password-input');
    
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
});