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

// Mobile Controls with Auto-Repeat
let moveInterval = null;

function startMove(action) {
    if (!game || game.gameOver) return;
    stopMove(); // Clear any existing interval
    
    action(); // Execute immediately
    
    // Initial delay before repeating (DAS)
    moveInterval = setTimeout(() => {
        moveInterval = setInterval(() => {
            action();
        }, 80); // Repeat rate (ARR)
    }, 200);
}

function stopMove() {
    clearTimeout(moveInterval);
    clearInterval(moveInterval);
    moveInterval = null;
}

const controls = [
    { id: 'ctrl-left', action: () => game?.move(-1) },
    { id: 'ctrl-right', action: () => game?.move(1) },
    { id: 'ctrl-down', action: () => {
        game?.drop();
        dropCounter = 0;
    }}
];

controls.forEach(ctrl => {
    const el = document.getElementById(ctrl.id);
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startMove(ctrl.action);
    });
    el.addEventListener('pointerup', stopMove);
    el.addEventListener('pointerleave', stopMove);
    el.addEventListener('pointercancel', stopMove);
});

// Single actions (Rotate, Hard Drop)
document.getElementById('ctrl-rotate').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    game?.rotate();
});
document.getElementById('ctrl-drop').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    game?.hardDrop();
});

// Prevent scrolling on touch
window.addEventListener('touchstart', e => {
    if (e.target.tagName !== 'BUTTON') e.preventDefault();
}, { passive: false });

window.addEventListener('resize', () => game?.resize());
