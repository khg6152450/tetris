const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const COLORS = {
    I: '#00f0f0',
    J: '#0000f0',
    L: '#f0a000',
    O: '#f0f000',
    S: '#00f000',
    T: '#a000f0',
    Z: '#f00000',
    G: '#333333' // Garbage color
};

const PIECES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};

class Game {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        this.ctx = canvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');
        
        this.resize();
        this.reset();
    }

    resize() {
        const container = this.canvas.parentElement;
        const padding = 10;
        const availableHeight = container.clientHeight - padding * 2;
        const availableWidth = container.clientWidth - padding * 2;
        
        let height = availableHeight;
        let width = (height / ROWS) * COLS;
        
        if (width > availableWidth) {
            width = availableWidth;
            height = (width / COLS) * ROWS;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.blockSize = width / COLS;
    }

    reset() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        
        this.nextPiece = this.getRandomPiece();
        this.spawnPiece();
    }

    getRandomPiece() {
        const keys = Object.keys(PIECES);
        const type = keys[Math.floor(Math.random() * keys.length)];
        return {
            type,
            matrix: PIECES[type],
            color: COLORS[type]
        };
    }

    spawnPiece() {
        this.piece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.pos = { x: Math.floor(COLS / 2) - Math.floor(this.piece.matrix[0].length / 2), y: 0 };
        
        if (this.collide()) {
            this.gameOver = true;
        }
        this.drawNext();
    }


    rotate() {
        const matrix = this.piece.matrix;
        const n = matrix.length;
        const newMatrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                newMatrix[x][n - 1 - y] = matrix[y][x];
            }
        }
        const oldMatrix = this.piece.matrix;
        this.piece.matrix = newMatrix;
        if (this.collide()) {
            this.piece.matrix = oldMatrix;
        }
    }

    move(dir) {
        this.pos.x += dir;
        if (this.collide()) {
            this.pos.x -= dir;
        }
    }

    drop() {
        this.pos.y++;
        if (this.collide()) {
            this.pos.y--;
            this.freeze();
            this.clearLines();
            this.spawnPiece();
            return false;
        }
        return true;
    }

    hardDrop() {
        while (this.drop()) {}
    }

    freeze() {
        this.piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const gridY = this.pos.y + y;
                    const gridX = this.pos.x + x;
                    if (gridY >= 0) this.grid[gridY][gridX] = this.piece.color;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [0, 100, 300, 500, 800][linesCleared] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) this.drawBlock(this.ctx, x, y, color);
            });
        });

        if (this.piece) {
            // Draw Ghost Piece
            const ghostPos = this.getGhostPos();
            this.piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(this.ctx, ghostPos.x + x, ghostPos.y + y, this.piece.color, 0.2);
                    }
                });
            });

            // Draw current piece
            this.piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) this.drawBlock(this.ctx, this.pos.x + x, this.pos.y + y, this.piece.color);
                });
            });
        }
    }

    getGhostPos() {
        const pos = { ...this.pos };
        while (!this.collide({ x: 0, y: 1 }, pos)) {
            pos.y++;
        }
        return pos;
    }

    // Overload collide to take optional position
    collide(offset = { x: 0, y: 0 }, customPos = null) {
        const p = customPos || this.pos;
        for (let y = 0; y < this.piece.matrix.length; y++) {
            for (let x = 0; x < this.piece.matrix[y].length; x++) {
                if (this.piece.matrix[y][x] !== 0) {
                    const newX = p.x + x + offset.x;
                    const newY = p.y + y + offset.y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    addGarbageLine() {
        // Move everything up
        this.grid.shift();
        
        // Add new line at bottom
        const newLine = Array(COLS).fill(COLORS.G);
        const gap = Math.floor(Math.random() * COLS);
        newLine[gap] = 0;
        this.grid.push(newLine);

        // Check if current piece collides with new garbage
        if (this.collide()) {
            this.pos.y--; // Push piece up if possible
            if (this.collide()) this.gameOver = true;
        }
    }

    drawBlock(ctx, x, y, color, opacity = 1) {
        const s = this.blockSize;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.shadowBlur = opacity === 1 ? 10 : 0;
        ctx.shadowColor = color;
        ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
        
        if (opacity === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x * s + 1, y * s + 1, s - 2, s / 4);
        }
        ctx.restore();
    }

    drawNext() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const s = 20;
        const matrix = this.nextPiece.matrix;
        const offsetX = (this.nextCanvas.width - matrix[0].length * s) / 2;
        const offsetY = (this.nextCanvas.height - matrix.length * s) / 2;
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(offsetX + x * s, offsetY + y * s, s - 2, s - 2);
                }
            });
        });
    }
}
