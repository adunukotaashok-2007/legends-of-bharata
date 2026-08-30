/* =========================================================
   LEGENDS OF BHARATA
   Mobile + PC Game
   ========================================================= */

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;
let paused = false;
let gameOver = false;
let victory = false;

let score = 0;
let coins = 0;

const worldWidth = 5200;

let cameraX = 0;

/* =========================================================
   PLAYER
========================================================= */

const player = {
    x: 150,
    y: 500,
    width: 42,
    height: 64,

    vx: 0,
    vy: 0,

    speed: 5,
    jumpPower: 14,

    health: 100,
    maxHealth: 100,

    grounded: false,
    facing: 1,

    attacking: false,
    attackTimer: 0,

    invincible: 0
};

/* =========================================================
   PHYSICS
========================================================= */

const gravity = 0.7;

/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (
        e.key === " " ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
    ) {
        e.preventDefault();
    }

    if (e.key.toLowerCase() === "p") {
        togglePause();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

/* =========================================================
   MOBILE INPUT
========================================================= */

const mobileInput = {
    left: false,
    right: false,
    jump: false,
    attack: false
};

function createMobileControls() {

    let controls = document.getElementById("mobileControls");

    if (!controls) {
        controls = document.createElement("div");
        controls.id = "mobileControls";

        controls.innerHTML = `
            <div class="movement">
                <button id="leftBtn">◀</button>
                <button id="rightBtn">▶</button>
            </div>

            <div class="actions">
                <button id="jumpBtn">▲</button>
                <button id="attackBtn">⚔</button>
            </div>
        `;

        document.body.appendChild(controls);
    }

    setupTouch("leftBtn", "left");
    setupTouch("rightBtn", "right");
    setupTouch("jumpBtn", "jump");
    setupTouch("attackBtn", "attack");
}

function setupTouch(id, action) {

    const button = document.getElementById(id);

    if (!button) return;

    const start = e => {
        e.preventDefault();
        mobileInput[action] = true;

        if (action === "jump") {
            jump();
        }

        if (action === "attack") {
            attack();
        }
    };

    const end = e => {
        e.preventDefault();
        mobileInput[action] = false;
    };

    button.addEventListener("touchstart", start, {
        passive: false
    });

    button.addEventListener("touchend", end, {
        passive: false
    });

    button.addEventListener("touchcancel", end, {
        passive: false
    });

    /* Also works with mouse */
    button.addEventListener("mousedown", start);
    button.addEventListener("mouseup", end);
    button.addEventListener("mouseleave", end);
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {

    const startButton =
        document.getElementById("startButton");

    if (startButton) {
        startButton.addEventListener("click", () => {
            beginGame();
        });
    }

    /* If HTML has a different start button */
    document.addEventListener("click", e => {

        if (
            e.target &&
            e.target.id === "startButton"
        ) {
            beginGame();
        }

    });
}

function beginGame() {

    gameStarted = true;
    paused = false;
    gameOver = false;
    victory = false;

    score = 0;
    coins = 0;

    player.x = 150;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;

    enemies.forEach((enemy, i) => {

        enemy.x = enemy.startX;
        enemy.health = enemy.maxHealth;
        enemy.dead = false;

    });

    updateScreen();
}

/* =========================================================
   JUMP
========================================================= */

function jump() {

    if (!gameStarted || paused || gameOver) return;

    if (player.grounded) {

        player.vy = -player.jumpPower;
        player.grounded = false;

    }
}

/* =========================================================
   ATTACK
========================================================= */

function attack() {

    if (!gameStarted || paused || gameOver) return;

    if (!player.attacking) {

        player.attacking = true;
        player.attackTimer = 15;

        checkAttack();

    }
}

/* =========================================================
   PLATFORMS
========================================================= */

const platforms = [

    {
        x: 0,
        y: 620,
        width: 800,
        height: 80
    },

    {
        x: 900,
        y: 620,
        width: 700,
        height: 80
    },

    {
        x: 1700,
        y: 560,
        width: 550,
        height: 80
    },

    {
        x: 2350,
        y: 620,
        width: 850,
        height: 80
    },

    {
        x: 3300,
        y: 540,
        width: 600,
        height: 80
    },

    {
        x: 4050,
        y: 620,
        width: 1100,
        height: 80
    }
];

/* =========================================================
   COINS
========================================================= */

const coinPositions = [

    { x: 350, y: 550 },
    { x: 650, y: 500 },

    { x: 1050, y: 550 },
    { x: 1350, y: 500 },

    { x: 1850, y: 490 },
    { x: 2150, y: 450 },

    { x: 2600, y: 550 },
    { x: 2900, y: 500 },

    { x: 3450, y: 470 },
    { x: 3750, y: 450 },

    { x: 4300, y: 550 },
    { x: 4700, y: 520 }
];

const collectedCoins =
    new Array(coinPositions.length).fill(false);

/* =========================================================
   ENEMIES
========================================================= */

const enemies = [

    {
        startX: 650,
        x: 650,
        y: 550,

        width: 42,
        height: 64,

        vx: 1.2,

        minX: 500,
        maxX: 750,

        health: 40,
        maxHealth: 40,

        dead: false,

        attackCooldown: 0
    },

    {
        startX: 1300,
        x: 1300,
        y: 550,

        width: 42,
        height: 64,

        vx: 1.5,

        minX: 1000,
        maxX: 1500,

        health: 40,
        maxHealth: 40,

        dead: false,

        attackCooldown: 0
    },

    {
        startX: 2050,
        x: 2050,
        y: 490,

        width: 42,
        height: 64,

        vx: 1.3,

        minX: 1750,
        maxX: 2200,

        health: 60,
        maxHealth: 60,

        dead: false,

        attackCooldown: 0
    },

    {
        startX: 2850,
        x: 2850,
        y: 550,

        width: 42,
        height: 64,

        vx: 1.7,

        minX: 2500,
        maxX: 3150,

        health: 60,
        maxHealth: 60,

        dead: false,

        attackCooldown: 0
    },

    {
        startX: 3650,
        x: 3650,
        y: 470,

        width: 42,
        height: 64,

        vx: 1.4,

        minX: 3350,
        maxX: 3850,

        health: 80,
        maxHealth: 80,

        dead: false,

        attackCooldown: 0
    }
];

/* =========================================================
   TEMPLE
========================================================= */

const temple = {
    x: 4750,
    y: 480,
    width: 280,
    height: 140
};

/* =========================================================
   COLLISION
========================================================= */

function collision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer() {

    if (gameOver || victory) return;

    let movingLeft =
        keys["a"] ||
        keys["arrowleft"] ||
        mobileInput.left;

    let movingRight =
        keys["d"] ||
        keys["arrowright"] ||
        mobileInput.right;

    if (movingLeft) {

        player.vx = -player.speed;
        player.facing = -1;

    } else if (movingRight) {

        player.vx = player.speed;
        player.facing = 1;

    } else {

        player.vx *= 0.75;

    }

    /* Keyboard jump */

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        if (player.grounded) {
            jump();
        }
    }

    player.x += player.vx;

    player.vy += gravity;
    player.y += player.vy;

    player.grounded = false;

    /* Platform collision */

    for (const platform of platforms) {

        if (
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height >= platform.y &&
            player.y + player.height <=
                platform.y + 30 &&
            player.vy >= 0
        ) {

            player.y =
                platform.y - player.height;

            player.vy = 0;
            player.grounded = true;

        }

    }

    /* World limits */

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x > worldWidth - player.width) {
        player.x = worldWidth - player.width;
    }

    /* Fall */

    if (player.y > H + 200) {

        damagePlayer(20);

        player.x -= 250;
        player.y = 300;
        player.vy = 0;

    }

    /* Attack timer */

    if (player.attackTimer > 0) {

        player.attackTimer--;

    } else {

        player.attacking = false;

    }

    if (player.invincible > 0) {
        player.invincible--;
    }

    collectCoins();
    checkTemple();

}

/* =========================================================
   ENEMY UPDATE
========================================================= */

function updateEnemies() {

    enemies.forEach(enemy => {

        if (enemy.dead) return;

        enemy.x += enemy.vx;

        if (
            enemy.x <= enemy.minX ||
            enemy.x >= enemy.maxX
        ) {

            enemy.vx *= -1;

        }

        /* Enemy attacks player */

        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }

        if (
            enemy.attackCooldown <= 0 &&
            collision(player, enemy)
        ) {

            damagePlayer(10);

            enemy.attackCooldown = 50;

        }

    });

}

/* =========================================================
   ATTACK COLLISION
========================================================= */

function checkAttack() {

    const attackRange = 75;

    enemies.forEach(enemy => {

        if (enemy.dead) return;

        let hitbox = {

            x:
                player.facing === 1
                    ? player.x + player.width
                    : player.x - attackRange,

            y: player.y + 10,

            width: attackRange,

            height: player.height - 15

        };

        if (collision(hitbox, enemy)) {

            enemy.health -= 20;

            score += 10;

            if (enemy.health <= 0) {

                enemy.dead = true;
                score += 50;

            }

        }

    });

}

/* =========================================================
   DAMAGE
========================================================= */

function damagePlayer(amount) {

    if (player.invincible > 0) return;

    player.health -= amount;

    player.invincible = 60;

    if (player.health <= 0) {

        player.health = 0;

        gameOver = true;

    }

}

/* =========================================================
   COINS
========================================================= */

function collectCoins() {

    coinPositions.forEach((coin, i) => {

        if (collectedCoins[i]) return;

        const c = {

            x: coin.x - 12,
            y: coin.y - 12,
            width: 24,
            height: 24

        };

        if (collision(player, c)) {

            collectedCoins[i] = true;

            coins++;
            score += 25;

        }

    });

}

/* =========================================================
   TEMPLE
========================================================= */

function checkTemple() {

    if (
        player.x + player.width >
        temple.x &&
        player.x <
        temple.x + temple.width
    ) {

        victory = true;

    }

}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    cameraX =
        player.x -
        W * 0.35;

    if (cameraX < 0) {
        cameraX = 0;
    }

    if (cameraX > worldWidth - W) {
        cameraX = worldWidth - W;
    }

}

/* =========================================================
   DRAW SKY
========================================================= */

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(
        0,
        "#62b6d5"
    );

    gradient.addColorStop(
        1,
        "#d4d8ad"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /* Sun */

    ctx.fillStyle = "#ffd45c";

    ctx.beginPath();

    ctx.arc(
        W - 110,
        100,
        55,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Mountains */

    ctx.fillStyle = "#668d78";

    for (
        let x = -500;
        x < worldWidth + 500;
        x += 600
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x - cameraX,
            620
        );

        ctx.lineTo(
            x + 300 - cameraX,
            250
        );

        ctx.lineTo(
            x + 600 - cameraX,
            620
        );

        ctx.closePath();

        ctx.fill();

    }

    /* Trees */

    for (
        let x = 100;
        x < worldWidth;
        x += 320
    ) {

        drawTree(
            x - cameraX,
            620
        );

    }

}

/* =========================================================
   TREE
========================================================= */

function drawTree(x, groundY) {

    ctx.fillStyle = "#704326";

    ctx.fillRect(
        x - 12,
        groundY - 120,
        24,
        120
    );

    ctx.fillStyle = "#23603a";

    ctx.beginPath();

    ctx.arc(
        x,
        groundY - 140,
        55,
        0,
        Math.PI * 2
    );

    ctx.fill();

}

/* =========================================================
   DRAW PLATFORM
========================================================= */

function drawPlatforms() {

    platforms.forEach(platform => {

        ctx.fillStyle = "#704a2e";

        ctx.fillRect(
            platform.x - cameraX,
            platform.y,
            platform.width,
            platform.height
        );

        ctx.fillStyle = "#3c7a43";

        ctx.fillRect(
            platform.x - cameraX,
            platform.y,
            platform.width,
            10
        );

    });

}

/* =========================================================
   DRAW COINS
========================================================= */

function drawCoins() {

    coinPositions.forEach((coin, i) => {

        if (collectedCoins[i]) return;

        const x = coin.x - cameraX;
        const y = coin.y;

        ctx.fillStyle = "#ffd21f";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            14,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#8b6200";

        ctx.font = "bold 14px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "₹",
            x,
            y + 5
        );

    });

}

/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    const x = player.x - cameraX;
    const y = player.y;

    /* Blink while damaged */

    if (
        player.invincible > 0 &&
        Math.floor(player.invincible / 5) % 2 === 0
    ) {
        return;
    }

    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        x + player.width / 2,
        y + player.height + 3,
        25,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Body */

    ctx.fillStyle = "#c62828";

    ctx.fillRect(
        x + 7,
        y + 27,
        28,
        30
    );

    /* Belt */

    ctx.fillStyle = "#e8bd35";

    ctx.fillRect(
        x + 7,
        y + 42,
        28,
        6
    );

    /* Head */

    ctx.fillStyle = "#c78b52";

    ctx.beginPath();

    ctx.arc(
        x + 21,
        y + 17,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* Hair */

    ctx.fillStyle = "#171717";

    ctx.fillRect(
        x + 7,
        y + 3,
        28,
        9
    );

    /* Legs */

    ctx.fillStyle = "#202020";

    ctx.fillRect(
        x + 10,
        y + 55,
        8,
        12
    );

    ctx.fillRect(
        x + 25,
        y + 55,
        8,
        12
    );

    /* Sword */

    ctx.save();

    ctx.translate(
        x + 34,
        y + 35
    );

    ctx.rotate(
        player.facing === 1
            ? -0.7
            : 0.7
    );

    ctx.fillStyle = "#eeeeee";

    ctx.fillRect(
        0,
        -3,
        player.attacking ? 45 : 30,
        5
    );

    ctx.restore();

    /* Attack effect */

    if (player.attacking) {

        ctx.strokeStyle = "#ffd54f";

        ctx.lineWidth = 5;

        ctx.beginPath();

        if (player.facing === 1) {

            ctx.arc(
                x + 40,
                y + 32,
                40,
                -1.1,
                0.8
            );

        } else {

            ctx.arc(
                x + 2,
                y + 32,
                40,
                2.3,
                4.2
            );

        }

        ctx.stroke();

    }

}

/* =========================================================
   DRAW ENEMY
========================================================= */

function drawEnemies() {

    enemies.forEach(enemy => {

        if (enemy.dead) return;

        const x = enemy.x - cameraX;
        const y = enemy.y;

        /* Body */

        ctx.fillStyle = "#55216b";

        ctx.fillRect(
            x + 6,
            y + 25,
            32,
            38
        );

        /* Head */

        ctx.fillStyle = "#a94444";

        ctx.beginPath();

        ctx.arc(
            x + 21,
            y + 15,
            16,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* Eyes */

        ctx.fillStyle = "#ff2020";

        ctx.fillRect(
            x + 12,
            y + 12,
            5,
            5
        );

        ctx.fillRect(
            x + 25,
            y + 12,
            5,
            5
        );

        /* Health bar */

        ctx.fillStyle = "#222";

        ctx.fillRect(
            x,
            y - 12,
            44,
            7
        );

        ctx.fillStyle = "#e53935";

        ctx.fillRect(
            x,
            y - 12,
            44 *
            (enemy.health / enemy.maxHealth),
            7
        );

    });

}

/* =========================================================
   DRAW TEMPLE
========================================================= */

function drawTemple() {

    const x = temple.x - cameraX;
    const y = temple.y;

    /* Building */

    ctx.fillStyle = "#c99655";

    ctx.fillRect(
        x,
        y + 40,
        temple.width,
        100
    );

    /* Roof */

    ctx.fillStyle = "#81472d";

    ctx.beginPath();

    ctx.moveTo(
        x - 20,
        y + 40
    );

    ctx.lineTo(
        x + temple.width / 2,
        y - 30
    );

    ctx.lineTo(
        x + temple.width + 20,
        y + 40
    );

    ctx.closePath();

    ctx.fill();

    /* Top */

    ctx.fillStyle = "#b77a36";

    ctx.beginPath();

    ctx.moveTo(
        x + temple.width / 2,
        y - 70
    );

    ctx.lineTo(
        x + temple.width / 2 - 25,
        y - 30
    );

    ctx.lineTo(
        x + temple.width / 2 + 25,
        y - 30
    );

    ctx.closePath();

    ctx.fill();

    /* Flag */

    ctx.fillStyle = "#5b351f";

    ctx.fillRect(
        x + temple.width / 2,
        y - 110,
        5,
        80
    );

    ctx.fillStyle = "#d84335";

    ctx.beginPath();

    ctx.moveTo(
        x + temple.width / 2 + 5,
        y - 108
    );

    ctx.lineTo(
        x + temple.width / 2 + 55,
        y - 95
    );

    ctx.lineTo(
        x + temple.width / 2 + 5,
        y - 80
    );

    ctx.closePath();

    ctx.fill();

    /* Om */

    ctx.fillStyle = "#ffe08a";

    ctx.font = "38px serif";

    ctx.textAlign = "center";

    ctx.fillText(
        "ॐ",
        x + temple.width / 2,
        y + 25
    );

    /* Door */

    ctx.fillStyle = "#432719";

    ctx.fillRect(
        x + temple.width / 2 - 28,
        y + 90,
        56,
        50
    );

}

/* =========================================================
   HUD
========================================================= */

function drawHUD() {

    ctx.fillStyle =
        "rgba(15,30,38,0.85)";

    ctx.fillRect(
        15,
        15,
        210,
        120
    );

    /* Health */

    ctx.fillStyle = "#ffffff";

    ctx.font = "18px Arial";

    ctx.textAlign = "left";

    ctx.fillText(
        "❤️ Health",
        28,
        42
    );

    ctx.fillStyle = "#431f1f";

    ctx.fillRect(
        28,
        50,
        170,
        14
    );

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        28,
        50,
        170 *
        (player.health / player.maxHealth),
        14
    );

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        "🪙 Coins: " + coins,
        28,
        92
    );

    ctx.fillText(
        "🏆 Score: " + score,
        28,
        118
    );

    /* Quest */

    ctx.fillStyle =
        "rgba(15,30,38,0.85)";

    ctx.fillRect(
        W / 2 - 150,
        20,
        300,
        65
    );

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";

    ctx.font = "bold 17px Arial";

    ctx.fillText(
        "📜 QUEST",
        W / 2,
        45
    );

    ctx.font = "15px Arial";

    ctx.fillText(
        "Reach the ancient temple",
        W / 2,
        70
    );

}

/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!gameStarted || gameOver || victory) {
        return;
    }

    paused = !paused;

}

/* =========================================================
   DRAW PAUSE
========================================================= */

function drawPause() {

    if (!paused) return;

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 45px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "GAME PAUSED",
        W / 2,
        H / 2
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Press P or Pause to continue",
        W / 2,
        H / 2 + 40
    );

}

/* =========================================================
   GAME OVER
========================================================= */

function drawGameOver() {

    if (!gameOver) return;

    ctx.fillStyle =
        "rgba(0,0,0,0.75)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";

    ctx.font = "bold 50px Arial";

    ctx.fillText(
        "GAME OVER",
        W / 2,
        H / 2 - 30
    );

    ctx.font = "20px Arial";

    ctx.fillText(
        "Tap BEGIN JOURNEY to play again",
        W / 2,
        H / 2 + 20
    );

}

/* =========================================================
   VICTORY
========================================================= */

function drawVictory() {

    if (!victory) return;

    ctx.fillStyle =
        "rgba(0,0,0,0.70)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.fillStyle = "#ffd54f";

    ctx.textAlign = "center";

    ctx.font = "bold 48px Arial";

    ctx.fillText(
        "VICTORY!",
        W / 2,
        H / 2 - 40
    );

    ctx.fillStyle = "#ffffff";

    ctx.font = "21px Arial";

    ctx.fillText(
        "You reached the ancient temple",
        W / 2,
        H / 2 + 5
    );

    ctx.fillText(
        "Score: " + score,
        W / 2,
        H / 2 + 45
    );

}

/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawBackground();

    drawPlatforms();

    drawCoins();

    drawTemple();

    drawEnemies();

    drawPlayer();

    drawHUD();

    drawPause();

    drawGameOver();

    drawVictory();

}

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {

    if (
        gameStarted &&
        !paused &&
        !gameOver &&
        !victory
    ) {

        updatePlayer();
        updateEnemies();
        updateCamera();

    }

    draw();

    requestAnimationFrame(gameLoop);

}

/* =========================================================
   PAUSE BUTTON
========================================================= */

function setupPauseButton() {

    const pauseButton =
        document.getElementById("pauseButton");

    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            togglePause
        );

    }

}

/* =========================================================
   INITIALIZE
========================================================= */

createMobileControls();
startGame();
setupPauseButton();

gameLoop();
