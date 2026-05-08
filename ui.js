let game;
let lastTime = 0;
let dropCounter = 0;
let garbageCounter = 0;

const canvas = document.getElementById('game-canvas');
const nextCanvas = document.getElementById('next-canvas');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');

function startGame() {
    game = new Game(canvas, nextCanvas);
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    update();
}

function update(time = 0) {
    if (game.gameOver) {
        gameOverScreen.classList.add('active');
        finalScoreEl.innerText = game.score;
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    garbageCounter += deltaTime;
    
    const dropInterval = Math.max(100, 1000 - (game.level - 1) * 100);
    const garbageInterval = Math.max(5000, 20000 - (game.level - 1) * 2000); // 20s start, min 5s

    if (dropCounter > dropInterval) {
        game.drop();
        dropCounter = 0;
    }

    if (garbageCounter > garbageInterval) {
        game.addGarbageLine();
        garbageCounter = 0;
    }

    game.draw();
    scoreEl.innerText = game.score;
    levelEl.innerText = game.level;
    
    requestAnimationFrame(update);
}

// Input Handling
window.addEventListener('keydown', event => {
    if (!game || game.gameOver) return;

    switch (event.key) {
        case 'ArrowLeft':
            game.move(-1);
            break;
        case 'ArrowRight':
            game.move(1);
            break;
        case 'ArrowDown':
            game.drop();
            dropCounter = 0;
            break;
        case 'ArrowUp':
            game.rotate();
            break;
        case ' ':
            game.hardDrop();
            break;
    }
});

// Mobile Controls
document.getElementById('ctrl-left').addEventListener('pointerdown', () => game?.move(-1));
document.getElementById('ctrl-right').addEventListener('pointerdown', () => game?.move(1));
document.getElementById('ctrl-rotate').addEventListener('pointerdown', () => game?.rotate());
document.getElementById('ctrl-down').addEventListener('pointerdown', () => {
    game?.drop();
    dropCounter = 0;
});
document.getElementById('ctrl-drop').addEventListener('pointerdown', () => game?.hardDrop());

// Prevent scrolling on touch
window.addEventListener('touchstart', e => {
    if (e.target.tagName !== 'BUTTON') e.preventDefault();
}, { passive: false });

window.addEventListener('resize', () => game?.resize());
