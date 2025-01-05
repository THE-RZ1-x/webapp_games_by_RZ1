class TicTacToe {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.showModeSelection();
    }

    initializeElements() {
        // Screens
        this.modeSelection = document.getElementById('mode-selection');
        this.difficultySelection = document.getElementById('difficulty-selection');
        this.gameScreen = document.getElementById('game-screen');
        
        // Game elements
        this.cells = document.querySelectorAll('[data-cell]');
        this.playerTurnText = document.getElementById('player-turn');
        this.resetButton = document.getElementById('reset-button');
        this.changeModeButton = document.getElementById('change-mode');
        this.backToModeButton = document.getElementById('back-to-mode');
        
        // Game state
        this.gameMode = '2player';
        this.difficulty = 'easy';
        this.currentPlayer = 'x';
        this.gameActive = true;
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
    }

    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', () => this.handleModeSelection(button.dataset.mode));
        });

        // Difficulty selection
        document.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', () => this.handleDifficultySelection(button.dataset.difficulty));
        });

        // Game controls
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.changeModeButton.addEventListener('click', () => this.showModeSelection());
        this.backToModeButton.addEventListener('click', () => this.showModeSelection());
    }

    showModeSelection() {
        this.modeSelection.classList.remove('hidden');
        this.difficultySelection.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
    }

    showDifficultySelection() {
        this.modeSelection.classList.add('hidden');
        this.difficultySelection.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
    }

    showGameScreen() {
        this.modeSelection.classList.add('hidden');
        this.difficultySelection.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.initGame();
    }

    handleModeSelection(mode) {
        this.gameMode = mode;
        if (mode === 'ai') {
            this.showDifficultySelection();
        } else {
            this.showGameScreen();
        }
    }

    handleDifficultySelection(difficulty) {
        this.difficulty = difficulty;
        this.showGameScreen();
    }

    initGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e), { once: true });
        });
    }

    async handleCellClick(e) {
        const cell = e.target;
        const cellIndex = Array.from(this.cells).indexOf(cell);

        if (!this.gameActive || this.gameState[cellIndex] !== '') return;

        await this.makeMove(cellIndex);

        if (this.gameMode === 'ai' && this.gameActive) {
            this.makeAIMove();
        }
    }

    async makeMove(cellIndex) {
        this.gameState[cellIndex] = this.currentPlayer;
        this.cells[cellIndex].classList.add(this.currentPlayer);
        this.cells[cellIndex].textContent = this.currentPlayer.toUpperCase();
        
        if (this.checkWin()) {
            this.gameActive = false;
            this.celebrateWin();
            return;
        }

        if (this.checkDraw()) {
            this.gameActive = false;
            this.playerTurnText.textContent = "It's a Draw!";
            this.playerTurnText.classList.add('winner-text');
            return;
        }

        this.currentPlayer = this.currentPlayer === 'x' ? 'o' : 'x';
        this.updateTurnText();
    }

    updateTurnText() {
        if (this.gameMode === '2player') {
            this.playerTurnText.textContent = `Player ${this.currentPlayer.toUpperCase()}'s Turn`;
        } else {
            this.playerTurnText.textContent = this.currentPlayer === 'x' ? 
                "Your Turn" : "Computer's Turn";
        }
    }

    makeAIMove() {
        setTimeout(() => {
            const move = this.getBestMove();
            this.makeMove(move);
        }, 500);
    }

    getBestMove() {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove();
            case 'medium':
                return Math.random() < 0.6 ? this.getSmartMove() : this.getRandomMove();
            case 'hard':
                return this.getMinimaxMove();
        }
    }

    getMinimaxMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        // Try each available move
        for (let i = 0; i < this.gameState.length; i++) {
            if (this.gameState[i] === '') {
                // Make the move
                this.gameState[i] = 'o';
                // Get score from minimax
                let score = this.minimax(this.gameState, 0, false);
                // Undo the move
                this.gameState[i] = '';
                
                // Update best score
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        // Check terminal states
        const result = this.checkGameResult(board);
        if (result !== null) {
            return result;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'o';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'x';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkGameResult(board) {
        // Check for winner
        for (let condition of this.winConditions) {
            if (condition.every(index => board[index] === 'o')) {
                return 10; // AI wins
            }
            if (condition.every(index => board[index] === 'x')) {
                return -10; // Human wins
            }
        }

        // Check for draw
        if (!board.includes('')) {
            return 0;
        }

        return null; // Game is not over
    }

    getSmartMove() {
        // Try to win
        const winningMove = this.findWinningMove('o');
        if (winningMove !== null) return winningMove;

        // Block player's winning move
        const blockingMove = this.findWinningMove('x');
        if (blockingMove !== null) return blockingMove;

        // Take center if available
        if (this.gameState[4] === '') return 4;

        // Take opposite corner if player has a corner
        const corners = [[0, 8], [2, 6]];
        for (let [corner1, corner2] of corners) {
            if (this.gameState[corner1] === 'x' && this.gameState[corner2] === '') {
                return corner2;
            }
            if (this.gameState[corner2] === 'x' && this.gameState[corner1] === '') {
                return corner1;
            }
        }

        // Take any available corner
        const availableCorners = [0, 2, 6, 8].filter(corner => this.gameState[corner] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take any available side
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(side => this.gameState[side] === '');
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }

        // Take any available move
        return this.getRandomMove();
    }

    findWinningMove(player) {
        for (let i = 0; i < this.gameState.length; i++) {
            if (this.gameState[i] === '') {
                this.gameState[i] = player;
                if (this.checkWin()) {
                    this.gameState[i] = '';
                    return i;
                }
                this.gameState[i] = '';
            }
        }
        return null;
    }

    checkWin() {
        return this.winConditions.some(condition => {
            return condition.every(index => {
                return this.gameState[index] === this.currentPlayer;
            });
        });
    }

    getWinningCombination() {
        for (let condition of this.winConditions) {
            if (condition.every(index => this.gameState[index] === this.currentPlayer)) {
                return condition;
            }
        }
        return null;
    }

    celebrateWin() {
        const winningCombo = this.getWinningCombination();
        
        winningCombo.forEach(index => {
            this.cells[index].classList.add('winner');
        });

        const winner = this.gameMode === '2player' ? 
            `Player ${this.currentPlayer.toUpperCase()} Wins!` :
            (this.currentPlayer === 'x' ? 'You Win!' : 'Computer Wins!');
            
        this.playerTurnText.textContent = winner;
        this.playerTurnText.classList.add('winner-text');

        this.createConfetti();
    }

    createConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const size = Math.random() * 5 + 5;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animationDuration = Math.random() * 2 + 1 + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }

    checkDraw() {
        return this.gameState.every(cell => cell !== '');
    }

    resetGame() {
        this.gameActive = true;
        this.currentPlayer = 'x';
        this.gameState = ['', '', '', '', '', '', '', '', ''];
        this.updateTurnText();
        this.playerTurnText.classList.remove('winner-text');
        
        this.cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'winner');
            cell.textContent = '';
        });

        this.cells.forEach(cell => {
            const clone = cell.cloneNode(true);
            cell.parentNode.replaceChild(clone, cell);
        });

        this.cells = document.querySelectorAll('[data-cell]');
        this.initGame();
    }

    getRandomMove() {
        const availableMoves = this.gameState
            .map((cell, index) => cell === '' ? index : null)
            .filter(cell => cell !== null);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
