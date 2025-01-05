class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.snake = [{x: Math.floor(this.tileCount/2), y: Math.floor(this.tileCount/2)}];
        this.food = this.generateFood();
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.score = 0;
        this.level = 1;
        this.foodToNextLevel = 5;
        this.foodCount = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 150;
        this.baseSpeed = 150;
        this.speedIncrement = 2;
        this.minSpeed = 50;
        this.gameLoop = null;
        this.animationFrame = null;
        this.lastMoveTime = 0;
        this.isPaused = false;
        this.obstacles = [];
        this.powerUps = [];
        this.powerUpActive = false;
        this.powerUpDuration = 5000;
        this.powerUpTimer = null;

        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.levelUpElement = document.getElementById('levelUp');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        
        this.setupEventListeners();
        this.highScoreElement.textContent = this.highScore;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.getElementById('upButton').addEventListener('click', () => this.setDirection(0, -1));
        document.getElementById('downButton').addEventListener('click', () => this.setDirection(0, 1));
        document.getElementById('leftButton').addEventListener('click', () => this.setDirection(-1, 0));
        document.getElementById('rightButton').addEventListener('click', () => this.setDirection(1, 0));
        
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
    }

    handleKeyPress(e) {
        if ((!this.gameLoop && !this.isPaused) || this.isPaused) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction.y !== 1) {
                    this.direction = {x: 0, y: -1};
                    this.nextDirection = {x: 0, y: -1};
                }
                break;
            case 'ArrowDown':
                if (this.direction.y !== -1) {
                    this.direction = {x: 0, y: 1};
                    this.nextDirection = {x: 0, y: 1};
                }
                break;
            case 'ArrowLeft':
                if (this.direction.x !== 1) {
                    this.direction = {x: -1, y: 0};
                    this.nextDirection = {x: -1, y: 0};
                }
                break;
            case 'ArrowRight':
                if (this.direction.x !== -1) {
                    this.direction = {x: 1, y: 0};
                    this.nextDirection = {x: 1, y: 0};
                }
                break;
            case 'p':
            case 'P':
                this.togglePause();
                break;
        }
    }

    setDirection(x, y) {
        if (!this.gameLoop || this.isPaused) return;
        
        if (this.direction.x !== -x || this.direction.y !== -y) {
            this.direction = {x, y};
            this.nextDirection = {x, y};
        }
    }

    showLevelUpEffect() {
        this.levelUpElement.classList.add('show');
        setTimeout(() => {
            this.levelUpElement.classList.remove('show');
        }, 1500);

        this.canvas.classList.add('rainbow-effect');
        setTimeout(() => {
            this.canvas.classList.remove('rainbow-effect');
        }, 2000);

        const levelDisplay = document.querySelector('.level');
        levelDisplay.classList.add('pulse');
        setTimeout(() => {
            levelDisplay.classList.remove('pulse');
        }, 500);
    }

    levelUp() {
        this.level++;
        this.levelElement.textContent = this.level;
        this.foodCount = 0;
        this.foodToNextLevel = Math.min(this.foodToNextLevel + 2, 15);
        this.showLevelUpEffect();
        
        if (this.gameSpeed > this.minSpeed) {
            this.gameSpeed = Math.max(this.minSpeed, this.baseSpeed - (this.level * 15));
        }

        this.obstacles = [];
        if (this.level > 1) {
            const numObstacles = Math.min(this.level - 1, 5); 
            for (let i = 0; i < numObstacles; i++) {
                this.addObstacle();
            }
        }

        if (this.level > 2 && Math.random() < 0.3) {
            this.addPowerUp();
        }
    }

    addObstacle() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (
            this.isPositionOccupied(position) ||
            this.isNearSnakeHead(position)
        );
        this.obstacles.push(position);
    }

    addPowerUp() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: Math.random() < 0.5 ? 'speed' : 'shield'
            };
        } while (
            this.isPositionOccupied(position) ||
            this.isNearSnakeHead(position)
        );
        this.powerUps = [position]; 
    }

    isPositionOccupied(position) {
        if (this.snake.some(segment => segment.x === position.x && segment.y === position.y)) {
            return true;
        }
        if (this.food.x === position.x && this.food.y === position.y) {
            return true;
        }
        if (this.obstacles.some(obs => obs.x === position.x && obs.y === position.y)) {
            return true;
        }
        if (this.powerUps.some(pow => pow.x === position.x && pow.y === position.y)) {
            return true;
        }
        return false;
    }

    isNearSnakeHead(position) {
        const head = this.snake[0];
        const distance = Math.abs(head.x - position.x) + Math.abs(head.y - position.y);
        return distance < 3; 
    }

    activatePowerUp(type) {
        this.powerUpActive = true;
        clearTimeout(this.powerUpTimer);

        if (type === 'speed') {
            const originalSpeed = this.gameSpeed;
            this.gameSpeed = Math.max(this.minSpeed, this.gameSpeed - 30);

            this.powerUpTimer = setTimeout(() => {
                this.gameSpeed = originalSpeed;
                this.powerUpActive = false;
            }, this.powerUpDuration);
        } else if (type === 'shield') {
            this.powerUpTimer = setTimeout(() => {
                this.powerUpActive = false;
            }, this.powerUpDuration);
        }
    }

    startGame() {
        if (this.gameLoop) return;
        
        this.snake = [{x: Math.floor(this.tileCount/2), y: Math.floor(this.tileCount/2)}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.score = 0;
        this.level = 1;
        this.foodCount = 0;
        this.foodToNextLevel = 5;
        this.gameSpeed = this.baseSpeed;
        this.scoreElement.textContent = '0';
        this.levelElement.textContent = '1';
        this.food = this.generateFood();
        this.isPaused = false;
        this.pauseButton.textContent = 'Pause';
        this.obstacles = [];
        this.powerUps = [];
        this.powerUpActive = false;
        this.lastMoveTime = performance.now();
        
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        
        this.gameLoop = true;
        this.animate();
    }

    togglePause() {
        if (!this.gameLoop && !this.isPaused) return;
        
        if (this.isPaused) {
            this.animate();
            this.pauseButton.textContent = 'Pause';
        } else {
            this.stopGame();
            this.pauseButton.textContent = 'Resume';
        }
        
        this.isPaused = !this.isPaused;
    }

    stopGame() {
        this.gameLoop = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
    }

    animate(currentTime = 0) {
        if (!this.gameLoop) return;
        
        if (!this.isPaused) {
            if (currentTime - this.lastMoveTime >= this.gameSpeed) {
                this.update();
                this.lastMoveTime = currentTime;
            }
            this.draw();
        }
        
        this.animationFrame = requestAnimationFrame(time => this.animate(time));
    }

    update() {
        if (this.direction.x === 0 && this.direction.y === 0) {
            this.draw();
            return;
        }

        const head = {
            x: (this.snake[0].x + this.direction.x + this.tileCount) % this.tileCount,
            y: (this.snake[0].y + this.direction.y + this.tileCount) % this.tileCount
        };

        if (!this.powerUpActive || this.powerUpActive === 'speed') {
            if (this.obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
                this.gameOver();
                return;
            }
        }

        const powerUpIndex = this.powerUps.findIndex(pow => pow.x === head.x && pow.y === head.y);
        if (powerUpIndex !== -1) {
            const powerUp = this.powerUps[powerUpIndex];
            this.activatePowerUp(powerUp.type);
            this.powerUps.splice(powerUpIndex, 1);
        }

        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.level;
            this.scoreElement.textContent = this.score;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
            
            this.food = this.generateFood();
            this.foodCount++;
            
            if (this.foodCount >= this.foodToNextLevel) {
                this.levelUp();
            }
        } else {
            this.snake.pop();
        }

        if (this.snake.length > 1 && (!this.powerUpActive || this.powerUpActive === 'speed')) {
            const headPos = this.snake[0];
            const body = this.snake.slice(1);
            if (body.some(segment => segment.x === headPos.x && segment.y === headPos.y)) {
                this.gameOver();
                return;
            }
        }
        
        this.draw();
    }

    checkCollision(position) {
        return this.snake.slice(1).some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.checkCollision(food));
        return food;
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        this.obstacles.forEach(obstacle => {
            const gradient = this.ctx.createRadialGradient(
                (obstacle.x + 0.5) * this.gridSize,
                (obstacle.y + 0.5) * this.gridSize,
                0,
                (obstacle.x + 0.5) * this.gridSize,
                (obstacle.y + 0.5) * this.gridSize,
                this.gridSize / 2
            );
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#880000');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                obstacle.x * this.gridSize,
                obstacle.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        });

        this.powerUps.forEach(powerUp => {
            const time = performance.now() * 0.002;
            const pulse = Math.sin(time) * 2;
            
            const gradient = this.ctx.createRadialGradient(
                (powerUp.x + 0.5) * this.gridSize,
                (powerUp.y + 0.5) * this.gridSize,
                0,
                (powerUp.x + 0.5) * this.gridSize,
                (powerUp.y + 0.5) * this.gridSize,
                (this.gridSize / 2) + pulse
            );
            
            if (powerUp.type === 'speed') {
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(1, '#888800');
            } else {
                gradient.addColorStop(0, '#00ffff');
                gradient.addColorStop(1, '#008888');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(
                (powerUp.x + 0.5) * this.gridSize,
                (powerUp.y + 0.5) * this.gridSize,
                (this.gridSize / 3) + pulse,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        this.snake.forEach((segment, index) => {
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                (segment.x + 1) * this.gridSize,
                (segment.y + 1) * this.gridSize
            );
            
            if (this.powerUpActive) {
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(1, '#ff00ff');
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 15;
            } else if (index === 0) {
                gradient.addColorStop(0, '#00ffff');
                gradient.addColorStop(1, '#0099ff');
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 15;
            } else {
                gradient.addColorStop(0, '#00ff00');
                gradient.addColorStop(1, '#008800');
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        const time = performance.now() * 0.002;
        const pulseSize = Math.sin(time) * 2;
        
        const foodGradient = this.ctx.createRadialGradient(
            (this.food.x + 0.5) * this.gridSize,
            (this.food.y + 0.5) * this.gridSize,
            2,
            (this.food.x + 0.5) * this.gridSize,
            (this.food.y + 0.5) * this.gridSize,
            (this.gridSize / 2) + pulseSize
        );
        
        foodGradient.addColorStop(0, '#ff0000');
        foodGradient.addColorStop(0.5, '#ff6666');
        foodGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = foodGradient;
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.gridSize,
            (this.food.y + 0.5) * this.gridSize,
            (this.gridSize / 2) - 2 + pulseSize,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    gameOver() {
        this.stopGame();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `Score: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
