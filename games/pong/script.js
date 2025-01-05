class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startButton = document.getElementById('startButton');
        this.resetButton = document.getElementById('resetButton');
        this.player1ScoreElement = document.getElementById('player1Score');
        this.player2ScoreElement = document.getElementById('player2Score');
        this.winMessageElement = document.getElementById('winMessage');

        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;

        // Game state
        this.isGameRunning = false;
        this.gameLoop = null;

        // Game objects
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            speed: 7,
            dx: 7,
            dy: 7,
            maxSpeed: 15
        };

        this.paddleHeight = 100;
        this.paddleWidth = 15;
        this.paddleSpeed = 10;

        this.player1 = {
            y: (this.canvas.height - this.paddleHeight) / 2,
            score: 0,
            up: false,
            down: false
        };

        this.player2 = {
            y: (this.canvas.height - this.paddleHeight) / 2,
            score: 0,
            up: false,
            down: false
        };

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Button controls
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetGame());

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    handleKeyDown(e) {
        switch(e.key.toLowerCase()) {
            case 'w': this.player1.up = true; break;
            case 's': this.player1.down = true; break;
            case 'arrowup': this.player2.up = true; break;
            case 'arrowdown': this.player2.down = true; break;
        }
    }

    handleKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'w': this.player1.up = false; break;
            case 's': this.player1.down = false; break;
            case 'arrowup': this.player2.up = false; break;
            case 'arrowdown': this.player2.down = false; break;
        }
    }

    handleResize() {
        const container = this.canvas.parentElement;
        const scale = Math.min(
            container.clientWidth / this.canvas.width,
            container.clientHeight / this.canvas.height
        );

        this.canvas.style.width = `${this.canvas.width * scale}px`;
        this.canvas.style.height = `${this.canvas.height * scale}px`;
    }

    startGame() {
        if (!this.isGameRunning) {
            this.isGameRunning = true;
            this.gameLoop = requestAnimationFrame(() => this.update());
            this.startButton.textContent = 'Pause Game';
            this.winMessageElement.textContent = '';
        } else {
            this.isGameRunning = false;
            cancelAnimationFrame(this.gameLoop);
            this.startButton.textContent = 'Resume Game';
        }
    }

    resetGame() {
        // Reset scores
        this.player1.score = 0;
        this.player2.score = 0;
        this.updateScore();

        // Reset positions
        this.resetPositions();

        // Reset game state
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameLoop);
        this.startButton.textContent = 'Start Game';
        this.winMessageElement.textContent = '';

        // Draw initial state
        this.draw();
    }

    resetPositions() {
        // Reset ball
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = this.ball.speed * (Math.random() > 0.5 ? 1 : -1);

        // Reset paddles
        this.player1.y = (this.canvas.height - this.paddleHeight) / 2;
        this.player2.y = (this.canvas.height - this.paddleHeight) / 2;
    }

    update() {
        if (!this.isGameRunning) return;

        this.movePaddles();
        this.moveBall();
        this.checkCollisions();
        this.draw();

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    movePaddles() {
        // Player 1 paddle movement
        if (this.player1.up && this.player1.y > 0) {
            this.player1.y -= this.paddleSpeed;
        }
        if (this.player1.down && this.player1.y < this.canvas.height - this.paddleHeight) {
            this.player1.y += this.paddleSpeed;
        }

        // Player 2 paddle movement
        if (this.player2.up && this.player2.y > 0) {
            this.player2.y -= this.paddleSpeed;
        }
        if (this.player2.down && this.player2.y < this.canvas.height - this.paddleHeight) {
            this.player2.y += this.paddleSpeed;
        }
    }

    moveBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with top and bottom walls
        if (this.ball.y + this.ball.radius > this.canvas.height || 
            this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
        }

        // Ball out of bounds
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            // Player 1 scores
            this.player1.score++;
            this.updateScore();
            this.checkWinner();
            this.resetPositions();
        } else if (this.ball.x - this.ball.radius < 0) {
            // Player 2 scores
            this.player2.score++;
            this.updateScore();
            this.checkWinner();
            this.resetPositions();
        }
    }

    checkCollisions() {
        // Check collision with player 1 paddle
        if (this.ball.dx < 0 && // Ball moving left
            this.ball.x - this.ball.radius <= this.paddleWidth && // Ball at paddle x position
            this.ball.x + this.ball.radius >= 0 && // Ball not past paddle
            this.ball.y >= this.player1.y && // Ball within paddle top
            this.ball.y <= this.player1.y + this.paddleHeight) { // Ball within paddle bottom
            
            this.ball.dx = Math.abs(this.ball.dx); // Ensure ball moves right
            this.increaseBallSpeed();
            this.adjustBallAngle(this.player1.y);
        }

        // Check collision with player 2 paddle
        if (this.ball.dx > 0 && // Ball moving right
            this.ball.x + this.ball.radius >= this.canvas.width - this.paddleWidth && // Ball at paddle x position
            this.ball.x - this.ball.radius <= this.canvas.width && // Ball not past paddle
            this.ball.y >= this.player2.y && // Ball within paddle top
            this.ball.y <= this.player2.y + this.paddleHeight) { // Ball within paddle bottom
            
            this.ball.dx = -Math.abs(this.ball.dx); // Ensure ball moves left
            this.increaseBallSpeed();
            this.adjustBallAngle(this.player2.y);
        }
    }

    increaseBallSpeed() {
        const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        if (speed < this.ball.maxSpeed) {
            const speedIncrease = 1.1;
            this.ball.dx *= speedIncrease;
            this.ball.dy *= speedIncrease;
        }
    }

    adjustBallAngle(paddleY) {
        // Calculate relative position of ball hit on paddle (-1 to 1)
        const relativeY = (this.ball.y - (paddleY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
        
        // Calculate new angle (-45 to 45 degrees)
        const angle = relativeY * Math.PI / 4;
        
        // Calculate speed
        const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        
        // Set new velocities
        const direction = this.ball.dx > 0 ? -1 : 1;
        this.ball.dx = direction * Math.abs(speed * Math.cos(angle));
        this.ball.dy = speed * Math.sin(angle);
    }

    updateScore() {
        this.player1ScoreElement.textContent = this.player1.score;
        this.player2ScoreElement.textContent = this.player2.score;
    }

    checkWinner() {
        const winningScore = 5;
        if (this.player1.score >= winningScore) {
            this.winMessageElement.textContent = 'Player 1 Wins!';
            this.endGame();
        } else if (this.player2.score >= winningScore) {
            this.winMessageElement.textContent = 'Player 2 Wins!';
            this.endGame();
        }
    }

    endGame() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameLoop);
        this.startButton.textContent = 'Start New Game';
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw paddles
        this.ctx.fillStyle = '#4a9eff';
        this.ctx.fillRect(0, this.player1.y, this.paddleWidth, this.paddleHeight);
        this.ctx.fillStyle = '#9b4aff';
        this.ctx.fillRect(
            this.canvas.width - this.paddleWidth,
            this.player2.y,
            this.paddleWidth,
            this.paddleHeight
        );

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.closePath();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});
