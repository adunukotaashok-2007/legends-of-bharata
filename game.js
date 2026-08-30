const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


// =====================================================
// CANVAS
// =====================================================

let W = 0;
let H = 0;

function resize() {

    W = canvas.width =
        window.innerWidth;

    H = canvas.height =
        window.innerHeight;
}

resize();

window.addEventListener(
    "resize",
    resize
);


// =====================================================
// GAME STATE
// =====================================================

let running = false;
let paused = false;

let score = 0;
let coins = 0;
let xp = 0;

let level = 1;

let cameraX = 0;

let gameTime = 0;

let highScore =
    Number(
        localStorage.getItem(
            "bharataHighScore"
        )
    ) || 0;


// =====================================================
// INPUT
// =====================================================

const keys = {
    left: false,
    right: false
};


window.addEventListener(
    "keydown",
    function(e) {

        const key =
            e.key.toLowerCase();

        if (
            key === "a" ||
            e.key === "ArrowLeft"
        ) {
            keys.left = true;
        }

        if (
            key === "d" ||
            e.key === "ArrowRight"
        ) {
            keys.right = true;
        }

        if (
            key === "w" ||
            e.key === "ArrowUp"
        ) {
            jump();
        }

        if (e.code === "Space") {
            e.preventDefault();
            attack();
        }

        if (key === "p") {
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
            e.key === "ArrowLeft"
        ) {
            keys.left = false;
        }

        if (
            key === "d" ||
            e.key === "ArrowRight"
        ) {
            keys.right = false;
        }
    }
);


// =====================================================
// PLAYER
// =====================================================

const player = {

    x: 250,
    y: 300,

    width: 48,
    height: 76,

    vx: 0,
    vy: 0,

    speed: 5,

    jumpPower: 14,

    grounded: false,

    health: 100,
    maxHealth: 100,

    attackTimer: 0,

    attackCooldown: 0,

    invincible: 0,

    facing: 1,

    walkFrame: 0
};


// =====================================================
// WORLD
// =====================================================

const worldWidth = 6000;

const platforms = [

    {
        x: 0,
        y: 520,
        width: 950,
        height: 100
    },

    {
        x: 1080,
        y: 470,
        width: 500,
        height: 150
    },

    {
        x: 1700,
        y: 520,
        width: 800,
        height: 100
    },

    {
        x: 2650,
        y: 455,
        width: 600,
        height: 165
    },

    {
        x: 3400,
        y: 520,
        width: 900,
        height: 100
    },

    {
        x: 4500,
        y: 470,
        width: 700,
        height: 150
    },

    {
        x: 5350,
        y: 520,
        width: 650,
        height: 100
    }
];


// =====================================================
// RIVER GAPS
// =====================================================

const rivers = [

    {
        x: 950,
        width: 130
    },

    {
        x: 1580,
        width: 120
    },

    {
        x: 3250,
        width: 150
    },

    {
        x: 4300,
        width: 200
    },

    {
        x: 5200,
        width: 150
    }
];


// =====================================================
// ENEMIES
// =====================================================

let enemies = [

    {
        x: 700,
        y: 444,

        width: 48,
        height: 76,

        health: 50,
        maxHealth: 50,

        speed: 1.1,

        alive: true,

        hitTimer: 0
    },

    {
        x: 1250,
        y: 394,

        width: 48,
        height: 76,

        health: 65,
        maxHealth: 65,

        speed: 1.2,

        alive: true,

        hitTimer: 0
    },

    {
        x: 2050,
        y: 444,

        width: 48,
        height: 76,

        health: 70,
        maxHealth: 70,

        speed: 1.3,

        alive: true,

        hitTimer: 0
    },

    {
        x: 2900,
        y: 379,

        width: 48,
        height: 76,

        health: 90,
        maxHealth: 90,

        speed: 1.5,

        alive: true,

        hitTimer: 0
    },

    {
        x: 3700,
        y: 444,

        width: 48,
        height: 76,

        health: 100,
        maxHealth: 100,

        speed: 1.5,

        alive: true,

        hitTimer: 0
    },

    {
        x: 4800,
        y: 394,

        width: 48,
        height: 76,

        health: 120,
        maxHealth: 120,

        speed: 1.6,

        alive: true,

        hitTimer: 0
    }
];


// =====================================================
// BOSS
// =====================================================

const boss = {

    x: 5650,
    y: 410,

    width: 75,
    height: 110,

    health: 500,
    maxHealth: 500,

    speed: 1.1,

    alive: true,

    attackTimer: 0
};


// =====================================================
// COINS
// =====================================================

let coinObjects = [

    {x: 450, y: 450, collected:false},
    {x: 550, y: 450, collected:false},
    {x: 850, y: 450, collected:false},

    {x: 1180, y: 400, collected:false},
    {x: 1400, y: 400, collected:false},

    {x: 1850, y: 450, collected:false},
    {x: 2150, y: 450, collected:false},
    {x: 2350, y: 450, collected:false},

    {x: 2750, y: 390, collected:false},
    {x: 3100, y: 390, collected:false},

    {x: 3550, y: 450, collected:false},
    {x: 4000, y: 450, collected:false},

    {x: 4600, y: 400, collected:false},
    {x: 4950, y: 400, collected:false},

    {x: 5500, y: 450, collected:false}
];


// =====================================================
// TREES
// =====================================================

const trees = [];

for (
    let x = 80;
    x < worldWidth;
    x += 230
) {

    trees.push({

        x:
            x +
            Math.random() * 80,

        scale:
            .75 +
            Math.random() * .45
    });
}


// =====================================================
// COLLISION
// =====================================================

function collision(a, b) {

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


// =====================================================
// JUMP
// =====================================================

function jump() {

    if (
        !running ||
        paused
    ) return;

    if (player.grounded) {

        player.vy =
            -player.jumpPower;

        player.grounded = false;
    }
}


// =====================================================
// ATTACK
// =====================================================

function attack() {

    if (
        !running ||
        paused
    ) return;

    if (
        player.attackCooldown <= 0
    ) {

        player.attackTimer = 16;

        player.attackCooldown = 25;
    }
}


// =====================================================
// PLAYER UPDATE
// =====================================================

function updatePlayer() {

    player.vx = 0;


    if (keys.left) {

        player.vx =
            -player.speed;

        player.facing = -1;
    }


    if (keys.right) {

        player.vx =
            player.speed;

        player.facing = 1;
    }


    player.x += player.vx;


    if (player.x < 0) {
        player.x = 0;
    }


    player.vy += 0.7;

    player.y += player.vy;


    player.grounded = false;


    for (
        const platform of platforms
    ) {

        if (

            player.x <
            platform.x +
            platform.width &&

            player.x +
            player.width >
            platform.x &&

            player.y +
            player.height >=
            platform.y &&

            player.y +
            player.height <=
            platform.y + 25 &&

            player.vy >= 0

        ) {

            player.y =
                platform.y -
                player.height;

            player.vy = 0;

            player.grounded = true;
        }
    }


    // Water / falling

    if (
        player.y > H + 150
    ) {

        damagePlayer(30);

        player.x =
            Math.max(
                0,
                player.x - 200
            );

        player.y = 250;

        player.vy = 0;
    }


    if (
        player.attackCooldown > 0
    ) {
        player.attackCooldown--;
    }


    if (
        player.attackTimer > 0
    ) {
        player.attackTimer--;
    }


    if (
        player.invincible > 0
    ) {
        player.invincible--;
    }


    if (
        player.vx !== 0 &&
        player.grounded
    ) {

        player.walkFrame += .25;
    }


    cameraX =
        player.x -
        W * .35;


    if (cameraX < 0) {
        cameraX = 0;
    }


    if (
        cameraX >
        worldWidth - W
    ) {

        cameraX =
            worldWidth - W;
    }
}


// =====================================================
// DAMAGE PLAYER
// =====================================================

function damagePlayer(amount) {

    if (
        player.invincible > 0
    ) return;

    player.health -= amount;

    player.invincible = 50;

    if (
        player.health <= 0
    ) {

        player.health = 0;

        gameOver();
    }
}


// =====================================================
// ENEMY UPDATE
// =====================================================

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        if (!enemy.alive)
            continue;


        enemy.hitTimer =
            Math.max(
                0,
                enemy.hitTimer - 1
            );


        const distance =
            player.x - enemy.x;


        if (
            Math.abs(distance) < 500
        ) {

            if (distance > 40) {

                enemy.x +=
                    enemy.speed;
            }

            else if (
                distance < -40
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

                damagePlayer(.35);
            }
        }


        if (
            player.attackTimer > 0
        ) {

            const hitBox = {

                x:
                    player.facing === 1
                    ? player.x + player.width
                    : player.x - 70,

                y:
                    player.y + 12,

                width: 70,

                height: 55
            };


            if (
                collision(
                    hitBox,
                    enemy
                ) &&
                enemy.hitTimer === 0
            ) {

                enemy.health -= 25;

                enemy.hitTimer = 20;

                if (
                    enemy.health <= 0
                ) {

                    enemy.alive = false;

                    score += 100;

                    coins += 5;

                    gainXP(30);
                }
            }
        }
    }
}


// =====================================================
// BOSS UPDATE
// =====================================================

function updateBoss() {

    if (!boss.alive)
        return;


    const distance =
        player.x - boss.x;


    if (
        Math.abs(distance) < 700
    ) {

        if (distance > 90) {

            boss.x +=
                boss.speed;
        }

        if (distance < -90) {

            boss.x -=
                boss.speed;
        }


        if (
            collision(
                player,
                boss
            )
        ) {

            damagePlayer(.6);
        }
    }


    if (
        player.attackTimer > 0
    ) {

        const hitBox = {

            x:
                player.facing === 1
                ? player.x + player.width
                : player.x - 80,

            y:
                player.y,

            width: 80,

            height: 70
        };


        if (
            collision(
                hitBox,
                boss
            )
        ) {

            boss.health -= 15;

            if (
                boss.health <= 0
            ) {

                boss.health = 0;

                boss.alive = false;

                score += 1000;

                coins += 50;

                gainXP(200);

                document
                    .getElementById("quest")
                    .textContent =
                    "🏆 The Guardian has fallen!";
            }
        }
    }
}


// =====================================================
// COINS
// =====================================================

function updateCoins() {

    for (
        const coin of coinObjects
    ) {

        if (coin.collected)
            continue;


        const box = {

            x: coin.x - 12,

            y: coin.y - 12,

            width: 24,

            height: 24
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


// =====================================================
// XP
// =====================================================

function gainXP(amount) {

    xp += amount;

    const needed =
        level * 100;


    if (xp >= needed) {

        xp -= needed;

        level++;

        player.maxHealth += 15;

        player.health =
            player.maxHealth;

        player.speed += .15;

        document
            .getElementById("quest")
            .textContent =
            "⭐ Level Up! You are now Level " +
            level;
    }
}


// =====================================================
// DRAW SKY
// =====================================================

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );


    gradient.addColorStop(
        0,
        "#74b9dc"
    );

    gradient.addColorStop(
        .55,
        "#b7dcae"
    );

    gradient.addColorStop(
        1,
        "#d9bd7c"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    // Sun

    ctx.fillStyle =
        "#ffd866";


    ctx.beginPath();

    ctx.arc(
        W - 130,
        95,
        48,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Mountains

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const x =
            i * 550 -
            cameraX * .18;


        ctx.fillStyle =
            i % 2 === 0
            ? "#688c78"
            : "#58796c";


        ctx.beginPath();

        ctx.moveTo(
            x,
            520
        );

        ctx.lineTo(
            x + 250,
            220
        );

        ctx.lineTo(
            x + 500,
            520
        );

        ctx.closePath();

        ctx.fill();
    }
}


// =====================================================
// DRAW TREES
// =====================================================

function drawTrees() {

    for (
        const tree of trees
    ) {

        const x =
            tree.x -
            cameraX * .55;

        const s =
            tree.scale;


        if (
            x < -100 ||
            x > W + 100
        )
            continue;


        const base = 520;


        ctx.fillStyle =
            "#62412b";


        ctx.fillRect(
            x,
            base - 130 * s,
            28 * s,
            130 * s
        );


        ctx.fillStyle =
            "#28633c";


        ctx.beginPath();

        ctx.arc(
            x + 14 * s,
            base - 150 * s,
            52 * s,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x - 18 * s,
            base - 125 * s,
            35 * s,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x + 45 * s,
            base - 125 * s,
            35 * s,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// =====================================================
// DRAW RIVERS
// =====================================================

function drawRivers() {

    for (
        const river of rivers
    ) {

        const x =
            river.x -
            cameraX;


        ctx.fillStyle =
            "#3e9bd1";


        ctx.fillRect(
            x,
            500,
            river.width,
            120
        );


        ctx.strokeStyle =
            "rgba(255,255,255,.45)";

        ctx.lineWidth = 3;


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x + 15,
                530 + i * 25
            );

            ctx.lineTo(
                x +
                river.width -
                15,
                530 + i * 25
            );

            ctx.stroke();
        }
    }
}


// =====================================================
// DRAW PLATFORMS
// =====================================================

function drawPlatforms() {

    for (
        const platform of platforms
    ) {

        const x =
            platform.x -
            cameraX;


        ctx.fillStyle =
            "#66442d";


        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            platform.height
        );


        ctx.fillStyle =
            "#3d7839";


        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            12
        );


        // Small stones

        ctx.fillStyle =
            "rgba(0,0,0,.15)";


        for (
            let s = 0;
            s < platform.width;
            s += 70
        ) {

            ctx.fillRect(
                x + s,
                platform.y + 35,
                35,
                5
            );
        }
    }
}


// =====================================================
// TEMPLE
// =====================================================

function drawTemple() {

    const x =
        1350 -
        cameraX * .7;


    const y = 470;


    ctx.fillStyle =
        "#b78a54";


    ctx.fillRect(
        x,
        y - 130,
        230,
        130
    );


    // Tower

    ctx.fillStyle =
        "#936438";


    ctx.beginPath();

    ctx.moveTo(
        x + 65,
        y - 130
    );

    ctx.lineTo(
        x + 115,
        y - 260
    );

    ctx.lineTo(
        x + 165,
        y - 130
    );

    ctx.closePath();

    ctx.fill();


    // Roof

    ctx.fillStyle =
        "#744a2c";


    ctx.beginPath();

    ctx.moveTo(
        x - 20,
        y - 130
    );

    ctx.lineTo(
        x + 115,
        y - 205
    );

    ctx.lineTo(
        x + 250,
        y - 130
    );

    ctx.closePath();

    ctx.fill();


    // Door

    ctx.fillStyle =
        "#39271c";


    ctx.fillRect(
        x + 90,
        y - 75,
        50,
        75
    );


    // Pillars

    ctx.fillStyle =
        "#d3aa70";


    ctx.fillRect(
        x + 20,
        y - 110,
        18,
        110
    );

    ctx.fillRect(
        x + 192,
        y - 110,
        18,
        110
    );


    // Flag

    ctx.strokeStyle =
        "#453426";

    ctx.lineWidth = 4;


    ctx.beginPath();

    ctx.moveTo(
        x + 115,
        y - 260
    );

    ctx.lineTo(
        x + 115,
        y - 305
    );

    ctx.stroke();


    ctx.fillStyle =
        "#c9452d";


    ctx.beginPath();

    ctx.moveTo(
        x + 115,
        y - 305
    );

    ctx.lineTo(
        x + 160,
        y - 290
    );

    ctx.lineTo(
        x + 115,
        y - 275
    );

    ctx.closePath();

    ctx.fill();
}


// =====================================================
// VILLAGE
// =====================================================

function drawVillage() {

    drawHouse(
        2200 - cameraX * .55,
        520
    );

    drawHouse(
        2400 - cameraX * .55,
        520
    );
}


function drawHouse(x, y) {

    ctx.fillStyle =
        "#c78d55";


    ctx.fillRect(
        x,
        y - 105,
        150,
        105
    );


    ctx.fillStyle =
        "#7b452d";


    ctx.beginPath();

    ctx.moveTo(
        x - 15,
        y - 105
    );

    ctx.lineTo(
        x + 75,
        y - 165
    );

    ctx.lineTo(
        x + 165,
        y - 105
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#422c20";


    ctx.fillRect(
        x + 58,
        y - 65,
        35,
        65
    );


    ctx.fillStyle =
        "#75bdd2";


    ctx.fillRect(
        x + 15,
        y - 70,
        30,
        30
    );
}


// =====================================================
// COINS DRAW
// =====================================================

function drawCoins() {

    for (
        const coin of coinObjects
    ) {

        if (coin.collected)
            continue;


        const x =
            coin.x -
            cameraX;


        const bob =
            Math.sin(
                gameTime * .08 +
                coin.x
            ) * 5;


        ctx.fillStyle =
            "#ffd338";


        ctx.beginPath();

        ctx.arc(
            x,
            coin.y + bob,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle =
            "#9c6d00";


        ctx.font =
            "bold 12px Arial";


        ctx.textAlign =
            "center";


        ctx.fillText(
            "₹",
            x,
            coin.y +
            bob +
            4
        );

        ctx.textAlign =
            "left";
    }
}


// =====================================================
// PLAYER DRAW
// =====================================================

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
        player.x -
        cameraX;

    const y =
        player.y;


    ctx.save();


    if (
        player.facing === -1
    ) {

        ctx.translate(
            x + player.width,
            0
        );

        ctx.scale(-1, 1);

    } else {

        ctx.translate(
            x,
            0
        );
    }


    // Shadow

    ctx.fillStyle =
        "rgba(0,0,0,.25)";


    ctx.beginPath();

    ctx.ellipse(
        player.width / 2,
        y + player.height + 4,
        27,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Legs

    ctx.fillStyle =
        "#35271f";


    ctx.fillRect(
        9,
        y + 56,
        12,
        20
    );

    ctx.fillRect(
        28,
        y + 56,
        12,
        20
    );


    // Body

    ctx.fillStyle =
        "#9e3027";


    ctx.beginPath();

    ctx.roundRect(
        7,
        y + 24,
        34,
        40,
        6
    );

    ctx.fill();


    // Belt

    ctx.fillStyle =
        "#d49b38";


    ctx.fillRect(
        7,
        y + 48,
        34,
        6
    );


    // Head

    ctx.fillStyle =
        "#b97852";


    ctx.beginPath();

    ctx.arc(
        24,
        y + 15,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Hair

    ctx.fillStyle =
        "#241b18";


    ctx.beginPath();

    ctx.arc(
        24,
        y + 8,
        15,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    // Headband

    ctx.fillStyle =
        "#d7a738";


    ctx.fillRect(
        9,
        y + 8,
        30,
        5
    );


    // Eye

    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        30,
        y + 15,
        3,
        3
    );


    // Sword

    ctx.strokeStyle =
        "#eee";


    ctx.lineWidth = 5;


    ctx.beginPath();

    if (
        player.attackTimer > 0
    ) {

        ctx.moveTo(
            34,
            y + 38
        );

        ctx.lineTo(
            73,
            y + 8
        );

    } else {

        ctx.moveTo(
            37,
            y + 43
        );

        ctx.lineTo(
            63,
            y + 20
        );
    }

    ctx.stroke();


    // Sword handle

    ctx.strokeStyle =
        "#7a4927";

    ctx.lineWidth = 7;


    ctx.beginPath();

    ctx.moveTo(
        31,
        y + 43
    );

    ctx.lineTo(
        43,
        y + 52
    );

    ctx.stroke();


    // Attack arc

    if (
        player.attackTimer > 0
    ) {

        ctx.strokeStyle =
            "#ffe36a";

        ctx.lineWidth = 7;


        ctx.beginPath();

        ctx.arc(
            35,
            y + 35,
            42,
            -.8,
            .7
        );

        ctx.stroke();
    }


    ctx.restore();
}


// =====================================================
// ENEMY DRAW
// =====================================================

function drawEnemy(enemy) {

    const x =
        enemy.x -
        cameraX;

    const y =
        enemy.y;


    // Shadow

    ctx.fillStyle =
        "rgba(0,0,0,.25)";


    ctx.beginPath();

    ctx.ellipse(
        x + 24,
        y + 78,
        27,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Body

    ctx.fillStyle =
        "#552657";


    ctx.fillRect(
        x + 6,
        y + 27,
        36,
        49
    );


    // Head

    ctx.fillStyle =
        "#9d6255";


    ctx.beginPath();

    ctx.arc(
        x + 24,
        y + 17,
        17,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Eyes

    ctx.fillStyle =
        "#ed2525";


    ctx.fillRect(
        x + 15,
        y + 14,
        5,
        5
    );

    ctx.fillRect(
        x + 28,
        y + 14,
        5,
        5
    );


    // Weapon

    ctx.strokeStyle =
        "#b8b8b8";

    ctx.lineWidth = 4;


    ctx.beginPath();

    ctx.moveTo(
        x + 8,
        y + 50
    );

    ctx.lineTo(
        x - 15,
        y + 20
    );

    ctx.stroke();


    // Health bar

    ctx.fillStyle =
        "#222";


    ctx.fillRect(
        x,
        y - 12,
        48,
        6
    );


    ctx.fillStyle =
        "#e33434";


    ctx.fillRect(
        x,
        y - 12,
        48 *
        Math.max(
            0,
            enemy.health /
            enemy.maxHealth
        ),
        6
    );
}


// =====================================================
// DRAW ENEMIES
// =====================================================

function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        if (
            enemy.alive
        ) {

            drawEnemy(
                enemy
            );
        }
    }
}


// =====================================================
// BOSS DRAW
// =====================================================

function drawBoss() {

    if (!boss.alive)
        return;


    const x =
        boss.x -
        cameraX;

    const y =
        boss.y;


    // Aura

    ctx.fillStyle =
        "rgba(110,20,130,.15)";


    ctx.beginPath();

    ctx.arc(
        x + 37,
        y + 55,
        65 +
        Math.sin(
            gameTime * .05
        ) * 5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Body

    ctx.fillStyle =
        "#351544";


    ctx.fillRect(
        x + 5,
        y + 35,
        65,
        75
    );


    // Head

    ctx.fillStyle =
        "#744449";


    ctx.beginPath();

    ctx.arc(
        x + 37,
        y + 22,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Crown

    ctx.fillStyle =
        "#d09a2f";


    ctx.beginPath();

    ctx.moveTo(
        x + 12,
        y + 8
    );

    ctx.lineTo(
        x + 25,
        y - 25
    );

    ctx.lineTo(
        x + 37,
        y + 3
    );

    ctx.lineTo(
        x + 50,
        y - 25
    );

    ctx.lineTo(
        x + 63,
        y + 8
    );

    ctx.closePath();

    ctx.fill();


    // Eyes

    ctx.fillStyle =
        "#ff3131";


    ctx.fillRect(
        x + 21,
        y + 20,
        7,
        6
    );

    ctx.fillRect(
        x + 47,
        y + 20,
        7,
        6
    );


    // Health bar

    ctx.fillStyle =
        "#222";


    ctx.fillRect(
        x - 15,
        y - 48,
        105,
        10
    );


    ctx.fillStyle =
        "#e22";


    ctx.fillRect(
        x - 15,
        y - 48,
        105 *
        (
            boss.health /
            boss.maxHealth
        ),
        10
    );


    ctx.fillStyle =
        "white";


    ctx.font =
        "bold 14px Arial";


    ctx.fillText(
        "FOREST GUARDIAN",
        x - 8,
        y - 57
    );
}


// =====================================================
// HUD UPDATE
// =====================================================

function updateHUD() {

    document
        .getElementById("health")
        .textContent =
        Math.floor(
            player.health
        );


    document
        .getElementById("coins")
        .textContent =
        coins;


    document
        .getElementById("level")
        .textContent =
        level;


    document
        .getElementById("score")
        .textContent =
        score;
}


// =====================================================
// DRAW
// =====================================================

function draw() {

    drawSky();

    drawTrees();

    drawTemple();

    drawVillage();

    drawRivers();

    drawPlatforms();

    drawCoins();

    drawEnemies();

    drawBoss();

    drawPlayer();

    updateHUD();
}


// =====================================================
// GAME LOOP
// =====================================================

function loop() {

    if (
        running &&
        !paused
    ) {

        gameTime++;

        updatePlayer();

        updateEnemies();

        updateBoss();

        updateCoins();

        draw();

    } else {

        draw();
    }


    requestAnimationFrame(
        loop
    );
}


// =====================================================
// START
// =====================================================

function startGame() {

    running = true;

    paused = false;

    document
        .getElementById(
            "startScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "pauseScreen"
        )
        .classList.add(
            "hidden"
        );
}


// =====================================================
// PAUSE
// =====================================================

function togglePause() {

    if (!running)
        return;


    paused = !paused;


    document
        .getElementById(
            "pauseScreen"
        )
        .classList.toggle(
            "hidden",
            !paused
        );
}


// =====================================================
// GAME OVER
// =====================================================

function gameOver() {

    running = false;


    if (
        score > highScore
    ) {

        highScore =
            score;

        localStorage.setItem(
            "bharataHighScore",
            highScore
        );
    }


    document
        .getElementById(
            "gameOverText"
        )
        .textContent =
        "Score: " +
        score +
        " | Coins: " +
        coins +
        " | High Score: " +
        highScore;


    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.remove(
            "hidden"
        );
}


// =====================================================
// RESTART
// =====================================================

function restartGame() {

    location.reload();
}


// =====================================================
// MOBILE CONTROLS
// =====================================================

function pressLeft() {
    keys.left = true;
}

function releaseLeft() {
    keys.left = false;
}

function pressRight() {
    keys.right = true;
}

function releaseRight() {
    keys.right = false;
}


// =====================================================
// INITIAL DRAW
// =====================================================

loop();
