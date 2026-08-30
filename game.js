const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================
   CANVAS
========================= */

let W;
let H;

function resizeCanvas() {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================
   GAME STATE
========================= */

let gameStarted = false;
let paused = false;
let gameOver = false;
let victory = false;

let score = 0;
let coins = 0;
let level = 1;

let cameraX = 0;
let frame = 0;

const WORLD_WIDTH = 6000;


/* =========================
   INPUT
========================= */

const input = {
    left: false,
    right: false
};


/* PC */

window.addEventListener(
    "keydown",
    function(e) {

        const key =
            e.key.toLowerCase();

        if (
            key === "a" ||
            e.key === "arrowleft"
        ) {
            input.left = true;
        }

        if (
            key === "d" ||
            e.key === "arrowright"
        ) {
            input.right = true;
        }

        if (
            key === "w" ||
            e.key === "arrowup"
        ) {
            jump();
        }

        if (e.code === "Space") {

            e.preventDefault();

            attack();
        }

        if (key === "e") {
            divinePower();
        }

        if (
            key === "p" ||
            key === "escape"
        ) {
            togglePause();
        }
    }
);


window.addEventListener(
    "keyup",
    function(e) {

        const key =
            e.key.toLowerCase();

        if (
            key === "a" ||
            key === "arrowleft"
        ) {
            input.left = false;
        }

        if (
            key === "d" ||
            key === "arrowright"
        ) {
            input.right = false;
        }
    }
);


/* =========================
   TOUCH BUTTON
========================= */

function holdButton(
    element,
    start,
    end
) {

    element.addEventListener(
        "pointerdown",
        function(e) {

            e.preventDefault();

            start();
        }
    );

    element.addEventListener(
        "pointerup",
        function(e) {

            e.preventDefault();

            end();
        }
    );

    element.addEventListener(
        "pointercancel",
        end
    );

    element.addEventListener(
        "pointerleave",
        end
    );
}


holdButton(
    document.getElementById("leftButton"),
    () => input.left = true,
    () => input.left = false
);


holdButton(
    document.getElementById("rightButton"),
    () => input.right = true,
    () => input.right = false
);


document
    .getElementById("jumpButton")
    .addEventListener(
        "pointerdown",
        jump
    );


document
    .getElementById("attackButton")
    .addEventListener(
        "pointerdown",
        attack
    );


document
    .getElementById("powerButton")
    .addEventListener(
        "pointerdown",
        divinePower
    );


/* =========================
   PLAYER
========================= */

const player = {

    x: 200,
    y: 300,

    width: 45,
    height: 75,

    vx: 0,
    vy: 0,

    speed: 5,

    jumpPower: 14,

    grounded: false,

    health: 100,
    maxHealth: 100,

    facing: 1,

    attackTimer: 0,
    attackCooldown: 0,

    powerCooldown: 0,

    invincible: 0
};


/* =========================
   WORLD
========================= */

const platforms = [

    { x: 0, y: 520, w: 850 },

    { x: 1000, y: 520, w: 500 },

    { x: 1650, y: 480, w: 850 },

    { x: 2700, y: 520, w: 550 },

    { x: 3450, y: 470, w: 800 },

    { x: 4400, y: 520, w: 900 },

    { x: 5450, y: 480, w: 550 }
];


/* =========================
   ENEMIES
========================= */

const enemies = [

    createEnemy(600, 445, 50),

    createEnemy(1200, 445, 60),

    createEnemy(1900, 405, 80),

    createEnemy(2300, 405, 80),

    createEnemy(2900, 445, 100),

    createEnemy(3700, 395, 120),

    createEnemy(4050, 395, 120),

    createEnemy(4650, 445, 150)
];


function createEnemy(
    x,
    y,
    health
) {

    return {

        x,
        y,

        width: 45,
        height: 75,

        health,
        maxHealth: health,

        speed: 0.7,

        alive: true,

        hitCooldown: 0
    };
}


/* =========================
   BOSS
========================= */

const boss = {

    x: 5550,
    y: 365,

    width: 80,
    height: 115,

    health: 500,
    maxHealth: 500,

    alive: true,

    speed: 0.7,

    hitCooldown: 0
};


/* =========================
   COINS
========================= */

const coinsList = [];

for (
    let x = 350;
    x < 5500;
    x += 180
) {

    coinsList.push({

        x,

        y:
            430 -
            Math.sin(x * 0.01) * 30,

        collected: false
    });
}


/* =========================
   JUMP
========================= */

function jump() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {
        return;
    }

    if (player.grounded) {

        player.vy =
            -player.jumpPower;

        player.grounded = false;
    }
}


/* =========================
   ATTACK
========================= */

function attack() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {
        return;
    }

    if (
        player.attackCooldown <= 0
    ) {

        player.attackTimer = 12;

        player.attackCooldown = 28;
    }
}


/* =========================
   DIVINE POWER
========================= */

function divinePower() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {
        return;
    }

    if (
        player.powerCooldown > 0
    ) {
        return;
    }

    player.powerCooldown = 300;

    score += 50;

    quest(
        "✨ Divine energy released!"
    );

    const range = 220;

    for (
        const enemy of enemies
    ) {

        if (
            enemy.alive &&
            Math.abs(
                enemy.x - player.x
            ) < range
        ) {

            enemy.health -= 50;

            if (
                enemy.health <= 0
            ) {

                enemy.health = 0;

                enemy.alive = false;

                score += 100;

                coins += 5;
            }
        }
    }

    if (
        boss.alive &&
        Math.abs(
            boss.x - player.x
        ) < range
    ) {

        boss.health -= 80;

        if (
            boss.health <= 0
        ) {

            boss.health = 0;

            boss.alive = false;

            score += 1000;

            victory = true;

            document
                .getElementById(
                    "victoryScreen"
                )
                .classList.remove(
                    "hidden"
                );

            document
                .getElementById(
                    "victoryMessage"
                )
                .textContent =
                "Score: " +
                score +
                " | Coins: " +
                coins;
        }
    }
}


/* =========================
   UPDATE PLAYER
========================= */

function updatePlayer() {

    player.vx = 0;

    if (input.left) {

        player.vx =
            -player.speed;

        player.facing = -1;
    }

    if (input.right) {

        player.vx =
            player.speed;

        player.facing = 1;
    }

    player.x += player.vx;

    player.x =
        Math.max(
            0,
            Math.min(
                WORLD_WIDTH -
                player.width,
                player.x
            )
        );


    player.vy += 0.7;

    player.y += player.vy;

    player.grounded = false;


    /* Platform collision */

    for (
        const p of platforms
    ) {

        if (

            player.x <
                p.x + p.w &&

            player.x +
                player.width >
                p.x &&

            player.y +
                player.height >=
                p.y &&

            player.y +
                player.height <=
                p.y + 35 &&

            player.vy >= 0

        ) {

            player.y =
                p.y -
                player.height;

            player.vy = 0;

            player.grounded = true;
        }
    }


    /* Falling */

    if (
        player.y > H + 200
    ) {

        damagePlayer(25);

        player.x =
            Math.max(
                0,
                player.x - 250
            );

        player.y = 200;

        player.vy = 0;
    }


    if (
        player.attackTimer > 0
    ) {
        player.attackTimer--;
    }

    if (
        player.attackCooldown > 0
    ) {
        player.attackCooldown--;
    }

    if (
        player.powerCooldown > 0
    ) {
        player.powerCooldown--;
    }

    if (
        player.invincible > 0
    ) {
        player.invincible--;
    }


    cameraX =
        player.x -
        W * 0.35;

    cameraX =
        Math.max(
            0,
            Math.min(
                WORLD_WIDTH - W,
                cameraX
            )
        );
}


/* =========================
   DAMAGE
========================= */

function damagePlayer(amount) {

    if (
        player.invincible > 0
    ) {
        return;
    }

    player.health -= amount;

    player.invincible = 50;

    if (
        player.health <= 0
    ) {

        player.health = 0;

        endGame();
    }
}


/* =========================
   ATTACK COLLISION
========================= */

function getAttackBox() {

    return {

        x:
            player.facing === 1
                ? player.x + player.width
                : player.x - 70,

        y:
            player.y + 10,

        width: 70,

        height: 55
    };
}


function updateAttacks() {

    if (
        player.attackTimer <= 0
    ) {
        return;
    }

    const hit =
        getAttackBox();


    for (
        const enemy of enemies
    ) {

        if (
            enemy.alive &&
            collision(
                hit,
                enemy
            )
        ) {

            if (
                enemy.hitCooldown <= 0
            ) {

                enemy.health -= 25;

                enemy.hitCooldown = 15;

                score += 10;

                if (
                    enemy.health <= 0
                ) {

                    enemy.health = 0;

                    enemy.alive = false;

                    score += 100;

                    coins += 3;
                }
            }
        }
    }


    if (
        boss.alive &&
        collision(
            hit,
            boss
        )
    ) {

        if (
            boss.hitCooldown <= 0
        ) {

            boss.health -= 20;

            boss.hitCooldown = 15;

            score += 20;

            if (
                boss.health <= 0
            ) {

                boss.health = 0;

                boss.alive = false;

                score += 1000;

                victory = true;

                document
                    .getElementById(
                        "victoryScreen"
                    )
                    .classList.remove(
                        "hidden"
                    );

                document
                    .getElementById(
                        "victoryMessage"
                    )
                    .textContent =
                    "Score: " +
                    score +
                    " | Coins: " +
                    coins;
            }
        }
    }
}


/* =========================
   ENEMIES
========================= */

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            !enemy.alive
        ) {
            continue;
        }


        if (
            enemy.hitCooldown > 0
        ) {
            enemy.hitCooldown--;
        }


        const distance =
            player.x -
            enemy.x;


        if (
            Math.abs(distance)
            < 450
        ) {

            if (
                distance > 50
            ) {

                enemy.x +=
                    enemy.speed;
            }

            if (
                distance < -50
            ) {

                enemy.x -=
                    enemy.speed;
            }


            if (
                collision(
                    player,
                    enemy
                )
            ) {

                damagePlayer(
                    0.35
                );
            }
        }
    }
}


/* =========================
   BOSS
========================= */

function updateBoss() {

    if (
        !boss.alive
    ) {
        return;
    }


    if (
        boss.hitCooldown > 0
    ) {
        boss.hitCooldown--;
    }


    const distance =
        player.x -
        boss.x;


    if (
        Math.abs(distance)
        < 750
    ) {

        if (
            distance > 90
        ) {

            boss.x +=
                boss.speed;
        }

        if (
            distance < -90
        ) {

            boss.x -=
                boss.speed;
        }


        if (
            collision(
                player,
                boss
            )
        ) {

            damagePlayer(
                0.6
            );
        }
    }
}


/* =========================
   COINS
========================= */

function updateCoins() {

    for (
        const coin of coinsList
    ) {

        if (
            coin.collected
        ) {
            continue;
        }


        const box = {

            x:
                coin.x - 13,

            y:
                coin.y - 13,

            width: 26,

            height: 26
        };


        if (
            collision(
                player,
                box
            )
        ) {

            coin.collected = true;

            coins++;

            score += 10;
        }
    }
}


/* =========================
   COLLISION
========================= */

function collision(
    a,
    b
) {

    return (

        a.x <
            b.x + b.width &&

        a.x + a.width >
            b.x &&

        a.y <
            b.y + b.height &&

        a.y + a.height >
            b.y
    );
}


/* =========================
   BACKGROUND
========================= */

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
        "#65b9df"
    );

    gradient.addColorStop(
        1,
        "#d9c27c"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* Sun */

    ctx.fillStyle =
        "#ffd65c";

    ctx.beginPath();

    ctx.arc(
        W - 100,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Mountains */

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const x =
            i * 500 -
            cameraX * 0.2;

        ctx.fillStyle =
            "#668a73";

        ctx.beginPath();

        ctx.moveTo(
            x,
            520
        );

        ctx.lineTo(
            x + 250,
            230
        );

        ctx.lineTo(
            x + 500,
            520
        );

        ctx.closePath();

        ctx.fill();
    }
}


/* =========================
   TREES
========================= */

function drawTree(
    x,
    y
) {

    ctx.fillStyle =
        "#65412d";

    ctx.fillRect(
        x - 10,
        y - 110,
        20,
        110
    );


    ctx.fillStyle =
        "#24613a";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 125,
        48,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x - 35,
        y - 100,
        32,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 35,
        y - 100,
        32,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


function drawTrees() {

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const x =
            i * 220 -
            cameraX * 0.5;

        drawTree(
            x,
            520
        );
    }
}


/* =========================
   TEMPLE
========================= */

function drawTemple() {

    const x =
        1200 -
        cameraX * 0.7;

    const y = 520;


    /* Building */

    ctx.fillStyle =
        "#c99558";

    ctx.fillRect(
        x,
        y - 130,
        230,
        130
    );


    /* Roof */

    ctx.fillStyle =
        "#78462e";

    ctx.beginPath();

    ctx.moveTo(
        x - 20,
        y - 130
    );

    ctx.lineTo(
        x + 115,
        y - 215
    );

    ctx.lineTo(
        x + 250,
        y - 130
    );

    ctx.closePath();

    ctx.fill();


    /* Tower */

    ctx.fillStyle =
        "#a76e39";

    ctx.beginPath();

    ctx.moveTo(
        x + 75,
        y - 130
    );

    ctx.lineTo(
        x + 115,
        y - 255
    );

    ctx.lineTo(
        x + 155,
        y - 130
    );

    ctx.closePath();

    ctx.fill();


    /* Door */

    ctx.fillStyle =
        "#3b251c";

    ctx.fillRect(
        x + 90,
        y - 75,
        50,
        75
    );


    /* Flag */

    ctx.strokeStyle =
        "#3b281d";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        x + 115,
        y - 255
    );

    ctx.lineTo(
        x + 115,
        y - 310
    );

    ctx.stroke();


    ctx.fillStyle =
        "#d84832";

    ctx.beginPath();

    ctx.moveTo(
        x + 115,
        y - 310
    );

    ctx.lineTo(
        x + 165,
        y - 295
    );

    ctx.lineTo(
        x + 115,
        y - 280
    );

    ctx.closePath();

    ctx.fill();


    /* Om */

    ctx.fillStyle =
        "#ffd36a";

    ctx.font =
        "bold 30px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "ॐ",
        x + 115,
        y - 170
    );

    ctx.textAlign =
        "left";
}


/* =========================
   VILLAGE
========================= */

function drawHouse(
    x,
    y
) {

    ctx.fillStyle =
        "#c78950";

    ctx.fillRect(
        x,
        y - 95,
        150,
        95
    );


    ctx.fillStyle =
        "#70412c";

    ctx.beginPath();

    ctx.moveTo(
        x - 15,
        y - 95
    );

    ctx.lineTo(
        x + 75,
        y - 160
    );

    ctx.lineTo(
        x + 165,
        y - 95
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#38261d";

    ctx.fillRect(
        x + 58,
        y - 60,
        35,
        60
    );


    ctx.fillStyle =
        "#72c4d8";

    ctx.fillRect(
        x + 15,
        y - 62,
        30,
        25
    );
}


function drawVillage() {

    drawHouse(
        2050 - cameraX * 0.5,
        480
    );

    drawHouse(
        2250 - cameraX * 0.5,
        480
    );
}


/* =========================
   RIVER
========================= */

function drawRiver(
    x,
    width
) {

    const sx =
        x - cameraX;

    ctx.fillStyle =
        "#3299ca";

    ctx.fillRect(
        sx,
        520,
        width,
        100
    );


    ctx.strokeStyle =
        "rgba(255,255,255,0.45)";

    ctx.lineWidth = 3;


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx + 10,
            545 + i * 22
        );

        ctx.lineTo(
            sx + width - 10,
            545 + i * 22
        );

        ctx.stroke();
    }
}


function drawRivers() {

    drawRiver(
        850,
        150
    );

    drawRiver(
        1500,
        150
    );

    drawRiver(
        3250,
        200
    );

    drawRiver(
        4250,
        150
    );

    drawRiver(
        5300,
        150
    );
}


/* =========================
   GROUND
========================= */

function drawPlatforms() {

    for (
        const p of platforms
    ) {

        const x =
            p.x - cameraX;


        ctx.fillStyle =
            "#65432c";

        ctx.fillRect(
            x,
            p.y,
            p.w,
            120
        );


        ctx.fillStyle =
            "#3d783c";

        ctx.fillRect(
            x,
            p.y,
            p.w,
            12
        );
    }
}


/* =========================
   COINS DRAW
========================= */

function drawCoins() {

    for (
        const coin of coinsList
    ) {

        if (
            coin.collected
        ) {
            continue;
        }


        const x =
            coin.x - cameraX;


        const y =
            coin.y +
            Math.sin(
                frame * 0.08 +
                coin.x
            ) * 5;


        ctx.fillStyle =
            "#ffd43b";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#8a6100";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "₹",
            x,
            y + 4
        );

        ctx.textAlign =
            "left";
    }
}


/* =========================
   PLAYER
========================= */

function drawPlayer() {

    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible / 5
        ) % 2 === 0
    ) {
        return;
    }


    const x =
        player.x - cameraX;

    const y =
        player.y;


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        x + 22,
        y + 78,
        25,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Legs */

    ctx.fillStyle =
        "#30241d";

    ctx.fillRect(
        x + 8,
        y + 55,
        12,
        20
    );

    ctx.fillRect(
        x + 27,
        y + 55,
        12,
        20
    );


    /* Body */

    ctx.fillStyle =
        "#9c2e27";

    ctx.fillRect(
        x + 6,
        y + 25,
        34,
        38
    );


    /* Belt */

    ctx.fillStyle =
        "#e0ad3e";

    ctx.fillRect(
        x + 6,
        y + 47,
        34,
        6
    );


    /* Head */

    ctx.fillStyle =
        "#b97853";

    ctx.beginPath();

    ctx.arc(
        x + 23,
        y + 15,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Hair */

    ctx.fillStyle =
        "#241b17";

    ctx.beginPath();

    ctx.arc(
        x + 23,
        y + 10,
        15,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /* Headband */

    ctx.fillStyle =
        "#e2ae3d";

    ctx.fillRect(
        x + 8,
        y + 9,
        30,
        5
    );


    /* Eye */

    ctx.fillStyle =
        "#111";

    ctx.fillRect(
        x + (
            player.facing === 1
                ? 29
                : 12
        ),
        y + 15,
        3,
        3
    );


    /* Sword */

    ctx.strokeStyle =
        "#eeeeee";

    ctx.lineWidth = 5;

    ctx.beginPath();


    if (
        player.attackTimer > 0
    ) {

        ctx.moveTo(
            x + 32,
            y + 42
        );

        ctx.lineTo(
            x +
                (
                    player.facing === 1
                        ? 72
                        : -30
                ),
            y + 5
        );

    } else {

        ctx.moveTo(
            x + 35,
            y + 43
        );

        ctx.lineTo(
            x +
                (
                    player.facing === 1
                        ? 62
                        : 5
                ),
            y + 20
        );
    }

    ctx.stroke();


    /* Attack glow */

    if (
        player.attackTimer > 0
    ) {

        ctx.strokeStyle =
            "#ffe36b";

        ctx.lineWidth = 6;

        ctx.beginPath();

        ctx.arc(
            x + 35,
            y + 35,
            42,
            -0.8,
            0.7
        );

        ctx.stroke();
    }


    /* Divine aura */

    if (
        player.powerCooldown >
        270
    ) {

        ctx.strokeStyle =
            "#ffe878";

        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.arc(
            x + 23,
            y + 35,
            55,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}


/* =========================
   ENEMY DRAW
========================= */

function drawEnemy(
    enemy
) {

    const x =
        enemy.x - cameraX;

    const y =
        enemy.y;


    /* Body */

    ctx.fillStyle =
        "#55255b";

    ctx.fillRect(
        x + 5,
        y + 28,
        35,
        47
    );


    /* Head */

    ctx.fillStyle =
        "#965b51";

    ctx.beginPath();

    ctx.arc(
        x + 22,
        y + 17,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Eyes */

    ctx.fillStyle =
        "#ff2929";

    ctx.fillRect(
        x + 13,
        y + 14,
        6,
        5
    );

    ctx.fillRect(
        x + 27,
        y + 14,
        6,
        5
    );


    /* Health */

    ctx.fillStyle =
        "#222";

    ctx.fillRect(
        x,
        y - 12,
        45,
        6
    );


    ctx.fillStyle =
        "#e33";

    ctx.fillRect(
        x,
        y - 12,
        45 *
        (
            enemy.health /
            enemy.maxHealth
        ),
        6
    );
}


function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            enemy.alive
        ) {
            drawEnemy(enemy);
        }
    }
}


/* =========================
   BOSS DRAW
========================= */

function drawBoss() {

    if (
        !boss.alive
    ) {
        return;
    }


    const x =
        boss.x - cameraX;

    const y =
        boss.y;


    /* Aura */

    ctx.fillStyle =
        "rgba(100,20,130,0.2)";

    ctx.beginPath();

    ctx.arc(
        x + 40,
        y + 60,
        80,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body */

    ctx.fillStyle =
        "#32133f";

    ctx.fillRect(
        x,
        y + 35,
        80,
        80
    );


    /* Head */

    ctx.fillStyle =
        "#704449";

    ctx.beginPath();

    ctx.arc(
        x + 40,
        y + 20,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Crown */

    ctx.fillStyle =
        "#d6a33b";

    ctx.beginPath();

    ctx.moveTo(
        x + 10,
        y + 5
    );

    ctx.lineTo(
        x + 25,
        y - 30
    );

    ctx.lineTo(
        x + 40,
        y
    );

    ctx.lineTo(
        x + 55,
        y - 30
    );

    ctx.lineTo(
        x + 70,
        y + 5
    );

    ctx.closePath();

    ctx.fill();


    /* Eyes */

    ctx.fillStyle =
        "#ff2222";

    ctx.fillRect(
        x + 20,
        y + 18,
        7,
        5
    );

    ctx.fillRect(
        x + 53,
        y + 18,
        7,
        5
    );


    /* Health bar */

    ctx.fillStyle =
        "#222";

    ctx.fillRect(
        x - 20,
        y - 55,
        120,
        11
    );


    ctx.fillStyle =
        "#e32626";

    ctx.fillRect(
        x - 20,
        y - 55,
        120 *
        (
            boss.health /
            boss.maxHealth
        ),
        11
    );


    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 13px Arial";

    ctx.fillText(
        "FOREST GUARDIAN",
        x - 5,
        y - 65
    );
}


/* =========================
   DRAW
========================= */

function draw() {

    drawBackground();

    drawTrees();

    drawTemple();

    drawVillage();

    drawRivers();

    drawPlatforms();

    drawCoins();

    drawEnemies();

    drawBoss();

    drawPlayer();
}


/* =========================
   HUD
========================= */

function updateHUD() {

    document
        .getElementById(
            "healthBar"
        )
        .style.width =
        player.health + "%";


    document
        .getElementById(
            "coins"
        )
        .textContent =
        coins;


    document
        .getElementById(
            "score"
        )
        .textContent =
        score;


    document
        .getElementById(
            "level"
        )
        .textContent =
        level;
}


/* =========================
   QUEST
========================= */

function quest(text) {

    document
        .getElementById(
            "questText"
        )
        .textContent =
        text;
}


/* =========================
   START
========================= */

function startGame() {

    gameStarted = true;

    paused = false;

    gameOver = false;

    victory = false;

    document
        .getElementById(
            "startScreen"
        )
        .classList.add(
            "hidden"
        );

    quest(
        "Reach the ancient temple."
    );
}


/* =========================
   PAUSE
========================= */

function togglePause() {

    if (
        !gameStarted ||
        gameOver ||
        victory
    ) {
        return;
    }

    paused =
        !paused;

    document
        .getElementById(
            "pauseScreen"
        )
        .classList.toggle(
            "hidden",
            !paused
        );
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    gameOver = true;

    gameStarted = false;

    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "gameOverMessage"
        )
        .textContent =
        "Score: " +
        score +
        " | Coins: " +
        coins;
}


/* =========================
   RESTART
========================= */

function restart() {

    location.reload();
}


/* =========================
   BUTTONS
========================= */

document
    .getElementById(
        "startButton"
    )
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById(
        "pauseButton"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "resumeButton"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "restartButton1"
    )
    .addEventListener(
        "click",
        restart
    );


document
    .getElementById(
        "restartButton2"
    )
    .addEventListener(
        "click",
        restart
    );


document
    .getElementById(
        "restartButton3"
    )
    .addEventListener(
        "click",
        restart
    );


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    frame++;

    if (
        gameStarted &&
        !paused &&
        !gameOver &&
        !victory
    ) {

        updatePlayer();

        updateAttacks();

        updateEnemies();

        updateBoss();

        updateCoins();

        /* Progress */

        if (
            player.x > 900 &&
            player.x < 1600
        ) {

            quest(
                "🏛️ Explore the ancient temple."
            );
        }

        if (
            player.x > 1600 &&
            player.x < 2700
        ) {

            quest(
                "🌲 Enter the sacred forest."
            );
        }

        if (
            player.x > 2700 &&
            player.x < 4400
        ) {

            quest(
                "⚔️ Defeat the forest guardians."
            );
        }

        if (
            player.x > 5000
        ) {

            quest(
                "👑 The Forest Guardian awaits!"
            );
        }

        updateHUD();
    }

    draw();

    requestAnimationFrame(
        gameLoop
    );
}


gameLoop();
