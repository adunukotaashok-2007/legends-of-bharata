const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W;
let H;

function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ===============================
// GAME STATE
// ===============================

let gameRunning = false;

let score = 0;
let coins = 0;

let cameraX = 0;

const gravity = 0.7;


// ===============================
// KEYBOARD
// ===============================

const keys = {
    left: false,
    right: false
};

window.addEventListener("keydown", (e) => {

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        keys.right = true;
    }

    if (e.key === "ArrowUp" ||
        e.key.toLowerCase() === "w") {

        jump();
    }

    if (e.code === "Space") {
        attack();
    }

});

window.addEventListener("keyup", (e) => {

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        keys.right = false;
    }

});


// ===============================
// PLAYER
// ===============================

const player = {

    x: 200,
    y: 300,

    width: 45,
    height: 70,

    vx: 0,
    vy: 0,

    speed: 5,
    jumpPower: 14,

    grounded: false,

    health: 100,

    attacking: false,

    attackTimer: 0
};


// ===============================
// PLATFORMS
// ===============================

const platforms = [

    {
        x: 0,
        y: 500,
        width: 1000,
        height: 100
    },

    {
        x: 1100,
        y: 450,
        width: 450,
        height: 100
    },

    {
        x: 1650,
        y: 500,
        width: 600,
        height: 100
    },

    {
        x: 2400,
        y: 420,
        width: 500,
        height: 100
    },

    {
        x: 3050,
        y: 500,
        width: 1000,
        height: 100
    }

];


// ===============================
// ENEMIES
// ===============================

let enemies = [

    {
        x: 750,
        y: 430,
        width: 45,
        height: 70,

        health: 50,

        speed: 1.2,

        alive: true
    },

    {
        x: 1300,
        y: 380,
        width: 45,
        height: 70,

        health: 50,

        speed: 1,

        alive: true
    },

    {
        x: 2000,
        y: 430,
        width: 45,
        height: 70,

        health: 70,

        speed: 1.4,

        alive: true
    }

];


// ===============================
// COINS
// ===============================

let coinObjects = [

    { x: 500, y: 430, collected: false },
    { x: 600, y: 430, collected: false },
    { x: 1200, y: 380, collected: false },
    { x: 1800, y: 430, collected: false },
    { x: 1900, y: 430, collected: false },
    { x: 2500, y: 350, collected: false }
];


// ===============================
// JUMP
// ===============================

function jump() {

    if (!gameRunning) return;

    if (player.grounded) {

        player.vy = -player.jumpPower;

        player.grounded = false;
    }
}


// ===============================
// ATTACK
// ===============================

function attack() {

    if (!gameRunning) return;

    if (!player.attacking) {

        player.attacking = true;

        player.attackTimer = 15;
    }
}


// ===============================
// COLLISION
// ===============================

function collision(a, b) {

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y

    );
}


// ===============================
// UPDATE PLAYER
// ===============================

function updatePlayer() {

    player.vx = 0;

    if (keys.left) {
        player.vx = -player.speed;
    }

    if (keys.right) {
        player.vx = player.speed;
    }

    player.x += player.vx;

    player.vy += gravity;

    player.y += player.vy;

    player.grounded = false;


    // Platform collision

    for (const platform of platforms) {

        if (

            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&

            player.y + player.height >= platform.y &&
            player.y + player.height <=
                platform.y + platform.height &&

            player.vy >= 0

        ) {

            player.y =
                platform.y - player.height;

            player.vy = 0;

            player.grounded = true;
        }
    }


    // Attack timer

    if (player.attacking) {

        player.attackTimer--;

        if (player.attackTimer <= 0) {
            player.attacking = false;
        }
    }


    // Camera

    cameraX = player.x - W * 0.35;

    if (cameraX < 0) {
        cameraX = 0;
    }

}


// ===============================
// UPDATE ENEMIES
// ===============================

function updateEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;


        // Enemy follows player

        if (player.x > enemy.x) {
            enemy.x += enemy.speed;
        }

        if (player.x < enemy.x) {
            enemy.x -= enemy.speed;
        }


        // Enemy attack

        if (collision(player, enemy)) {

            player.health -= 0.3;

            if (player.health <= 0) {

                gameOver();
            }
        }


        // Player attack

        if (player.attacking) {

            const attackBox = {

                x: player.x + 35,

                y: player.y + 10,

                width: 55,

                height: 50
            };

            if (collision(attackBox, enemy)) {

                enemy.health -= 2;

                if (enemy.health <= 0) {

                    enemy.alive = false;

                    score += 100;
                }
            }
        }

    }

}


// ===============================
// UPDATE COINS
// ===============================

function updateCoins() {

    for (const coin of coinObjects) {

        if (coin.collected) continue;

        const coinBox = {

            x: coin.x,
            y: coin.y,

            width: 25,
            height: 25
        };

        if (collision(player, coinBox)) {

            coin.collected = true;

            coins++;

            score += 10;
        }
    }

}


// ===============================
// DRAW BACKGROUND
// ===============================

function drawBackground() {

    // Sky

    ctx.fillStyle = "#86c8e8";

    ctx.fillRect(0, 0, W, H);


    // Sun

    ctx.fillStyle = "#ffd45c";

    ctx.beginPath();

    ctx.arc(
        W - 120,
        100,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Mountains

    ctx.fillStyle = "#5b8268";

    for (let i = 0; i < 8; i++) {

        const x =
            i * 500 - cameraX * 0.25;

        ctx.beginPath();

        ctx.moveTo(x, 500);

        ctx.lineTo(x + 200, 250);

        ctx.lineTo(x + 400, 500);

        ctx.fill();
    }


    // Trees

    for (let i = 0; i < 15; i++) {

        const x =
            i * 300 - cameraX * 0.5;

        drawTree(x, 500);
    }

}


// ===============================
// TREE
// ===============================

function drawTree(x, groundY) {

    ctx.fillStyle = "#633c25";

    ctx.fillRect(
        x + 25,
        groundY - 130,
        30,
        130
    );


    ctx.fillStyle = "#275c35";

    ctx.beginPath();

    ctx.arc(
        x + 40,
        groundY - 145,
        55,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ===============================
// DRAW PLATFORM
// ===============================

function drawPlatforms() {

    for (const platform of platforms) {

        const x =
            platform.x - cameraX;

        ctx.fillStyle = "#65452d";

        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            platform.height
        );


        ctx.fillStyle = "#3c7135";

        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            12
        );
    }

}


// ===============================
// DRAW PLAYER
// ===============================

function drawPlayer() {

    const x =
        player.x - cameraX;

    const y =
        player.y;


    // Body

    ctx.fillStyle = "#8b1e1e";

    ctx.fillRect(
        x + 8,
        y + 25,
        30,
        40
    );


    // Head

    ctx.fillStyle = "#c6865a";

    ctx.beginPath();

    ctx.arc(
        x + 23,
        y + 15,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Headband

    ctx.fillStyle = "#e4b34b";

    ctx.fillRect(
        x + 7,
        y + 5,
        32,
        6
    );


    // Legs

    ctx.fillStyle = "#292929";

    ctx.fillRect(
        x + 8,
        y + 60,
        10,
        10
    );

    ctx.fillRect(
        x + 27,
        y + 60,
        10,
        10
    );


    // Weapon

    ctx.strokeStyle = "#eee";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        x + 30,
        y + 40
    );

    ctx.lineTo(
        x + 65,
        y + 15
    );

    ctx.stroke();


    // Attack effect

    if (player.attacking) {

        ctx.strokeStyle = "#ffd447";

        ctx.lineWidth = 7;

        ctx.beginPath();

        ctx.arc(
            x + 40,
            y + 35,
            40,
            -0.7,
            0.8
        );

        ctx.stroke();
    }

}


// ===============================
// DRAW ENEMIES
// ===============================

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        const x =
            enemy.x - cameraX;

        const y =
            enemy.y;


        ctx.fillStyle = "#54205f";

        ctx.fillRect(
            x + 5,
            y + 25,
            35,
            45
        );


        ctx.fillStyle = "#a85c52";

        ctx.beginPath();

        ctx.arc(
            x + 22,
            y + 15,
            15,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Eyes

        ctx.fillStyle = "red";

        ctx.fillRect(
            x + 14,
            y + 12,
            5,
            5
        );

        ctx.fillRect(
            x + 26,
            y + 12,
            5,
            5
        );


        // Health bar

        ctx.fillStyle = "#222";

        ctx.fillRect(
            x,
            y - 12,
            45,
            6
        );

        ctx.fillStyle = "#e33";

        ctx.fillRect(
            x,
            y - 12,
            45 *
            (enemy.health / 70),
            6
        );

    }

}


// ===============================
// DRAW COINS
// ===============================

function drawCoins() {

    for (const coin of coinObjects) {

        if (coin.collected) continue;

        const x =
            coin.x - cameraX;

        ctx.fillStyle = "#ffd700";

        ctx.beginPath();

        ctx.arc(
            x + 12,
            coin.y + 12,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

}


// ===============================
// HUD
// ===============================

function drawHUD() {

    ctx.fillStyle = "rgba(0,0,0,0.55)";

    ctx.fillRect(
        15,
        15,
        230,
        100
    );


    ctx.fillStyle = "white";

    ctx.font = "18px Arial";

    ctx.fillText(
        "❤️ Health: " +
        Math.max(0, Math.floor(player.health)),
        30,
        42
    );

    ctx.fillText(
        "🪙 Coins: " + coins,
        30,
        68
    );

    ctx.fillText(
        "🏆 Score: " + score,
        30,
        94
    );

}


// ===============================
// DRAW EVERYTHING
// ===============================

function draw() {

    drawBackground();

    drawPlatforms();

    drawCoins();

    drawEnemies();

    drawPlayer();

    drawHUD();

}


// ===============================
// GAME LOOP
// ===============================

function gameLoop() {

    if (gameRunning) {

        updatePlayer();

        updateEnemies();

        updateCoins();

        draw();
    }

    requestAnimationFrame(gameLoop);
}


// ===============================
// START GAME
// ===============================

function startGame() {

    document
        .getElementById("startScreen")
        .classList.add("hidden");

    document
        .getElementById("gameOverScreen")
        .classList.add("hidden");

    gameRunning = true;

}


// ===============================
// GAME OVER
// ===============================

function gameOver() {

    gameRunning = false;

    document
        .getElementById("finalScore")
        .textContent =
        "Score: " + score +
        " | Coins: " + coins;

    document
        .getElementById("gameOverScreen")
        .classList.remove("hidden");
}


// ===============================
// RESTART
// ===============================

function restartGame() {

    location.reload();
}


// Start rendering

gameLoop();
