const SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

const START = Uint8Array.from([
    0x20,
    0x10,
    0x00,
    0xD0,
    0x07,
    0x68,
    0x00,
    0x03
]);

let trikiRX;
let connected = false;

let gyro = { x: 0, y: 0, z: 0 };
let accel = { x: 0, y: 0, z: 0 };

// GAME CORE
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let currentGame = null;
let gameInterval = null;

function clearCanvas() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 900, 500);
}

function setupGame(name) {
    currentGame = name;
    document.getElementById("menu").style.display = "none";
    document.getElementById("back").style.display = "block";
    if (gameInterval) clearInterval(gameInterval);
}

// ==================== 1. PONG ====================
let playerY = 200;
let enemyY = 200;
let ball = { x: 450, y: 250, vx: 5, vy: 3 };
let pongScore = 0;

function startPong() {
    setupGame("pong");
    playerY = 200;
    enemyY = 200;
    ball = { x: 450, y: 250, vx: 5, vy: 3 };
    pongScore = 0;
    gameInterval = setInterval(pongLoop, 1000 / 60);
}

function pongLoop() {
    playerY += accel.y * 8;
    if (playerY < 0) playerY = 0;
    if (playerY > 400) playerY = 400;

    enemyY += (ball.y - enemyY - 50) * 0.05;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y < 0 || ball.y > 500) ball.vy *= -1;

    if (ball.x < 35 && ball.y > playerY && ball.y < playerY + 100) {
        ball.vx *= -1;
        pongScore++;
    }
    if (ball.x > 865 && ball.y > enemyY && ball.y < enemyY + 100) ball.vx *= -1;

    if (ball.x < 0 || ball.x > 900) {
        ball.x = 450;
        ball.y = 250;
        ball.vx *= -1;
        pongScore = Math.max(0, pongScore - 1);
    }

    clearCanvas();
    ctx.fillStyle = "white";
    ctx.fillRect(20, playerY, 15, 100);
    ctx.fillRect(865, enemyY, 15, 100);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Счёт: " + pongScore, 30, 40);
}


// ==================== 2. SNAKE ====================
let snake = [];
let food = {};
let snakeDir = { x: 20, y: 0 };
let nextDir = { x: 20, y: 0 };
let snakeScore = 0;

function startSnake() {
    setupGame("snake");
    snake = [
        { x: 300, y: 250 },
        { x: 280, y: 250 },
        { x: 260, y: 250 }
    ];
    snakeScore = 0;
    spawnFood();
    snakeDir = { x: 20, y: 0 };
    nextDir = { x: 20, y: 0 };
    gameInterval = setInterval(snakeLoop, 1000 / 10);
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * 43) * 20 + 20,
        y: Math.floor(Math.random() * 23) * 20 + 20
    };
}

function snakeLoop() {
    if (Math.abs(accel.x) > Math.abs(accel.y)) {
        if (accel.x > 3 && snakeDir.x === 0) nextDir = { x: 20, y: 0 };
        else if (accel.x < -3 && snakeDir.x === 0) nextDir = { x: -20, y: 0 };
    } else {
        if (accel.y > 3 && snakeDir.y === 0) nextDir = { x: 0, y: 20 };
        else if (accel.y < -3 && snakeDir.y === 0) nextDir = { x: 0, y: -20 };
    }
    snakeDir = nextDir;

    let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

    if (head.x < 0 || head.x >= 900 || head.y < 0 || head.y >= 500) {
        startSnake();
        return;
    }

    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            startSnake();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        snakeScore++;
        spawnFood();
    } else {
        snake.pop();
    }

    clearCanvas();
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, 18, 18);

    ctx.fillStyle = "lime";
    for (let part of snake) {
        ctx.fillRect(part.x, part.y, 18, 18);
    }

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Счёт: " + snakeScore, 30, 40);
}


// ==================== 3. TOSS ====================
let tossBall = { x: 450, y: 250, vx: 0, vy: 0 };
let target = { x: 450, y: 100, radius: 40 };
let tossScore = 0;

function startToss() {
    setupGame("toss");
    tossBall = { x: 450, y: 400, vx: 0, vy: 0 };
    tossScore = 0;
    spawnTarget();
    gameInterval = setInterval(tossLoop, 1000 / 60);
}

function spawnTarget() {
    target.x = Math.random() * 700 + 100;
    target.y = Math.random() * 250 + 80;
}

function tossLoop() {
    tossBall.vx += accel.x * 0.4;
    tossBall.vy += accel.y * 0.4;

    tossBall.vx *= 0.95;
    tossBall.vy *= 0.95;

    tossBall.x += tossBall.vx;
    tossBall.y += tossBall.vy;

    if (tossBall.x < 15) { tossBall.x = 15; tossBall.vx *= -1; }
    if (tossBall.x > 885) { tossBall.x = 885; tossBall.vx *= -1; }
    if (tossBall.y < 15) { tossBall.y = 15; tossBall.vy *= -1; }
    if (tossBall.y > 485) { tossBall.y = 485; tossBall.vy *= -1; }

    let dist = Math.hypot(tossBall.x - target.x, tossBall.y - target.y);
    if (dist < target.radius) {
        tossScore++;
        spawnTarget();
    }

    clearCanvas();
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff3366";
    ctx.beginPath();
    ctx.arc(tossBall.x, tossBall.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Счёт: " + tossScore, 30, 40);
}


// ==================== 4. BOXING ====================
let boxerState = "idle";
let enemyHp = 100;
let playerHp = 100;
let punchCooldown = 0;
let boxingScore = 0;

function startBoxing() {
    setupGame("boxing");
    enemyHp = 100;
    playerHp = 100;
    boxingScore = 0;
    punchCooldown = 0;
    gameInterval = setInterval(boxingLoop, 1000 / 60);
}

function boxingLoop() {
    if (punchCooldown > 0) punchCooldown--;

    if (punchCooldown === 0) {
        if (accel.x > 5) {
            boxerState = "punch_right";
            enemyHp -= 15;
            boxingScore += 10;
            punchCooldown = 20;
        } else if (accel.x < -5) {
            boxerState = "punch_left";
            enemyHp -= 15;
            boxingScore += 10;
            punchCooldown = 20;
        } else {
            boxerState = "idle";
        }
    }

    if (Math.random() < 0.02 && playerHp > 0) {
        playerHp -= 5;
    }

    clearCanvas();

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Ваше здоровье: " + Math.max(0, playerHp), 50, 50);
    ctx.fillText("Здоровье противника: " + Math.max(0, enemyHp), 520, 50);
    ctx.fillText("Очки: " + boxingScore, 50, 90);

    ctx.fillStyle = boxerState !== "idle" ? "#00ffcc" : "#2d7cff";
    ctx.fillRect(200, 250, 80, 150);
    if (boxerState === "punch_right") {
        ctx.fillRect(280, 280, 60, 30);
    } else if (boxerState === "punch_left") {
        ctx.fillRect(280, 330, 60, 30);
    }

    ctx.fillStyle = "#ff3333";
    ctx.fillRect(620, 250, 80, 150);

    if (enemyHp <= 0 || playerHp <= 0) {
        ctx.fillStyle = "gold";
        ctx.font = "40px Arial";
        ctx.fillText(enemyHp <= 0 ? "ПОБЕДА!" : "ПОРАЖЕНИЕ!", 330, 200);
    }
}


// ==================== 5. CRAZY FROG ====================
let frogY = 380;
let frogVy = 0;
let isJumping = false;
let obstacles = [];
let frogScore = 0;
let obsTimer = 0;

function startFrog() {
    setupGame("frog");
    frogY = 380;
    frogVy = 0;
    isJumping = false;
    obstacles = [];
    frogScore = 0;
    obsTimer = 0;
    gameInterval = setInterval(frogLoop, 1000 / 60);
}

function frogLoop() {
    if (!isJumping && accel.y < -4) {
        frogVy = -14;
        isJumping = true;
    }

    frogVy += 0.6;
    frogY += frogVy;

    if (frogY > 380) {
        frogY = 380;
        frogVy = 0;
        isJumping = false;
    }

    obsTimer++;
    if (obsTimer > 90) {
        obstacles.push({ x: 900, w: 30, h: 40 });
        obsTimer = 0;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 6;

        if (
            obstacles[i].x < 180 &&
            obstacles[i].x + obstacles[i].w > 150 &&
            frogY + 40 > 420 - obstacles[i].h
        ) {
            startFrog();
            return;
        }

        if (obstacles[i].x < -50) {
            obstacles.splice(i, 1);
            frogScore++;
        }
    }

    clearCanvas();

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 420, 900, 80);

    ctx.fillStyle = "#22bb22";
    ctx.fillRect(150, frogY, 40, 40);

    ctx.fillStyle = "#ff5555";
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, 420 - obs.h, obs.w, obs.h);
    }

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Очки: " + frogScore, 30, 40);
}


// ==================== BLE CONNECTION ====================

document.getElementById("connect").onclick = async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Triki" }],
            optionalServices: [SERVICE]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE);
        trikiRX = await service.getCharacteristic(RX);
        const tx = await service.getCharacteristic(TX);

        await tx.startNotifications();

        tx.addEventListener("characteristicvaluechanged", e => {
            const d = new Uint8Array(e.target.value.buffer);
            if (d.length < 14) return;
            if (d[0] !== 0x22 || d[1] !== 0x00) return;

            const dv = new DataView(d.buffer);

            gyro.x = dv.getInt16(2, true) / 131;
            gyro.y = dv.getInt16(4, true) / 131;
            gyro.z = dv.getInt16(6, true) / 131;

            accel.x = dv.getInt16(8, true) / 2048;
            accel.y = dv.getInt16(10, true) / 2048;
            accel.z = dv.getInt16(12, true) / 2048;
        });

        await trikiRX.writeValueWithoutResponse(START);
        connected = true;
        document.getElementById("status").innerHTML = "🟢 Connected";
    } catch (err) {
        console.error("Bluetooth connection failed:", err);
    }
};


// ==================== UI BUTTONS BINDING ====================

document.getElementById("pong").onclick = startPong;
document.getElementById("snake").onclick = startSnake;
document.getElementById("toss").onclick = startToss;
document.getElementById("boxing").onclick = startBoxing;
document.getElementById("frog").onclick = startFrog;

document.getElementById("back").onclick = () => {
    if (gameInterval) clearInterval(gameInterval);
    currentGame = null;
    clearCanvas();
    document.getElementById("menu").style.display = "block";
    document.getElementById("back").style.display = "none";
};
