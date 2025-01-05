class MemoryGame {
    constructor() {
        // Game elements
        this.gameBoard = document.getElementById('gameBoard');
        this.moveCount = document.getElementById('moveCount');
        this.timeCount = document.getElementById('timeCount');
        this.scoreCount = document.getElementById('scoreCount');
        this.startButton = document.getElementById('startButton');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.levelUpNotification = document.getElementById('levelUpNotification');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.playAgainButton = document.getElementById('playAgainButton');

        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.timeElapsed = 0;
        this.gameTimer = null;
        this.isGameActive = false;
        this.canFlip = true;

        // Card symbols (emojis)
        this.emojis = [
            '🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎢',
            '🎡', '🎠', '🎪', '🎭', '🎨', '🎯', '🎲', '🎮',
            '🎸', '🎺', '🎷', '🎹', '🥁', '🎼', '🎵', '🎶',
            '🦄', '🐉', '🦕', '🦖', '🐋', '🦈', '🐊', '🦓'
        ];

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.playAgainButton.addEventListener('click', () => this.startGame());
        this.difficultySelect.addEventListener('change', () => {
            if (this.isGameActive) {
                if (confirm('Starting a new game will reset your progress. Continue?')) {
                    this.startGame();
                } else {
                    this.difficultySelect.value = this.currentDifficulty;
                }
            }
        });
    }

    startGame() {
        // Reset game state
        this.clearBoard();
        this.moves = 0;
        this.score = 0;
        this.timeElapsed = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.canFlip = true;
        this.isGameActive = true;
        this.currentDifficulty = this.difficultySelect.value;

        // Update display
        this.moveCount.textContent = '0';
        this.scoreCount.textContent = '0';
        this.timeCount.textContent = '0:00';
        this.gameOverScreen.classList.remove('show');

        // Set up board based on difficulty
        const gridSize = this.getGridSize();
        const totalPairs = (gridSize * gridSize) / 2;
        
        // Create and shuffle cards
        const cardEmojis = this.getRandomEmojis(totalPairs);
        const shuffledEmojis = [...cardEmojis, ...cardEmojis]
            .sort(() => Math.random() - 0.5);

        // Set up game board grid
        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Create cards
        shuffledEmojis.forEach((emoji, index) => {
            this.createCard(emoji, index);
        });

        // Start timer
        if (this.gameTimer) clearInterval(this.gameTimer);
        this.gameTimer = setInterval(() => this.updateTimer(), 1000);
    }

    getGridSize() {
        switch (this.difficultySelect.value) {
            case 'easy': return 4;
            case 'medium': return 6;
            case 'hard': return 8;
            default: return 4;
        }
    }

    getRandomEmojis(count) {
        return this.emojis
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
    }

    createCard(emoji, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.value = emoji;

        card.innerHTML = `
            <div class="card-front">${emoji}</div>
            <div class="card-back">?</div>
        `;

        card.addEventListener('click', () => this.flipCard(card));
        this.gameBoard.appendChild(card);
        this.cards.push(card);
    }

    flipCard(card) {
        if (!this.canFlip || card.classList.contains('flipped') || 
            card.classList.contains('matched') || !this.isGameActive) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.moveCount.textContent = this.moves;
            this.canFlip = false;
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.value === card2.dataset.value;

        if (match) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    handleMatch(card1, card2) {
        card1.classList.add('matched', 'matching');
        card2.classList.add('matched', 'matching');
        
        setTimeout(() => {
            card1.classList.remove('matching');
            card2.classList.remove('matching');
        }, 500);

        this.matchedPairs++;
        this.updateScore(true);
        this.flippedCards = [];
        this.canFlip = true;

        if (this.matchedPairs === this.cards.length / 2) {
            this.gameWon();
        }
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.flippedCards = [];
            this.canFlip = true;
        }, 1000);
        this.updateScore(false);
    }

    updateScore(isMatch) {
        // Score calculation based on moves and time
        const basePoints = isMatch ? 100 : -10;
        const timeMultiplier = Math.max(0.1, 1 - (this.timeElapsed / 100));
        const movePenalty = Math.max(0.1, 1 - (this.moves / 50));
        
        const points = Math.round(basePoints * timeMultiplier * movePenalty);
        this.score = Math.max(0, this.score + points);
        this.scoreCount.textContent = this.score;
    }

    updateTimer() {
        this.timeElapsed++;
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timeCount.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    gameWon() {
        clearInterval(this.gameTimer);
        this.isGameActive = false;
        
        // Update final stats
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalTime').textContent = this.timeCount.textContent;
        document.getElementById('finalScore').textContent = this.score;
        
        // Show game over screen with animation
        setTimeout(() => {
            this.gameOverScreen.classList.add('show');
        }, 500);
    }

    clearBoard() {
        while (this.gameBoard.firstChild) {
            this.gameBoard.removeChild(this.gameBoard.firstChild);
        }
        this.cards = [];
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
