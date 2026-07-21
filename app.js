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


// ==================== 2. SNAKE (ИСПРАВЛЕНО: Плавный поворот по порогам наклона) ====================
let snake = [];
let food = {};
let snakeDir = { x: 2, y: 0 };
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
    snakeDir = { x: 2, y: 0 }; // Стартовое движение вправо
    gameInterval = setInterval(snakeLoop, 1000 / 30); // 30 кадров для плавной непрерывной змейки
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * 42) * 20 + 30,
        y: Math.floor(Math.random() * 22) * 20 + 30
    };
}

function snakeLoop() {
    // Управление наклоном (порог ±2.5, запрет разворота на 180 градусов назад)
    if (accel.x > 2.5 && snakeDir.x === 0) {
        snakeDir = { x: 2, y: 0 };
    } else if (accel.x < -2.5 && snakeDir.x === 0) {
        snakeDir = { x: -2, y: 0 };
    } else if (accel.y > 2.5 && snakeDir.y === 0) {
        snakeDir = { x: 0, y: 2 };
    } else if (accel.y < -2.5 && snakeDir.y === 0) {
        snakeDir = { x: 0, y: -2 };
    }

    let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

    // Проверка стен
    if (head.x < 0 || head.x >= 900 || head.y < 0 || head.y >= 500) {
        startSnake();
        return;
    }

    // Проверка столкновения с собой
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            startSnake();
            return;
        }
    }

    snake.unshift(head);

    // Поедание еды
    let dist = Math.hypot(head.x - food.x, head.y - food.y);
    if (dist < 15) {
        snakeScore++;
        spawnFood();
    } else {
        snake.pop();
    }

    clearCanvas();
    ctx.fillStyle = "red";
    ctx.fillRect(food.x - 8, food.y - 8, 16, 16);

    ctx.fillStyle = "lime";
    for (let part of snake) {
        ctx.fillRect(part.x - 8, part.y - 8, 16, 16);
    }

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Счёт: " + snakeScore, 30, 40);
}


// ==================== 3. TOSS (ИСПРАВЛЕНО: Управляется наклоном как у жабки, собираем монетки) ====================
let tossBall = { x: 450, y: 250 };
let tossTarget = { x: 450, y: 250, radius: 25 };
let tossScore = 0;

function startToss() {
    setupGame("toss");
    tossBall = { x: 450, y: 250 };
    tossScore = 0;
    spawnTossTarget();
    gameInterval = setInterval(tossLoop, 1000 / 60);
}

function spawnTossTarget() {
    tossTarget.x = Math.random() * 700 + 100;
    tossTarget.y = Math.random() * 350 + 80;
}

function tossLoop() {
    // Наклон Triki напрямую двигает шарик по экрану (как у жабки)
    tossBall.x += accel.x * 3.5;
    tossBall.y += accel.y * 3.5;

    // Границы холста
    if (tossBall.x < 20) tossBall.x = 20;
    if (tossBall.x > 880) tossBall.x = 880;
    if (tossBall.y < 20) tossBall.y = 20;
    if (tossBall.y > 480) tossBall.y = 480;

    // Сбор цели
    let dist = Math.hypot(tossBall.x - tossTarget.x, tossBall.y - tossTarget.y);
    if (dist < tossTarget.radius + 15) {
        tossScore++;
        spawnTossTarget();
    }

    clearCanvas();
    // Цель
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(tossTarget.x, tossTarget.y, tossTarget.radius, 0, Math.PI * 2);
    ctx.fill();

    // Шар игрока
    ctx.fillStyle = "#ff3366";
    ctx.beginPath();
    ctx.arc(tossBall.x, tossBall.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Счёт: " + tossScore, 30, 40);
}


// ==================== 4. BOXING (ИСПРАВЛЕНО: УЛЬТРА-ХАРДКОРНЫЙ СИЛОМЕР, хрен набьешь больше 300) ====================
let punchState = "ready"; 
let currentPunchScore = 0;
let maxPunchScore = 0;
let punchTimer = 0;

function startBoxing() {
    setupGame("boxing");
    punchState = "ready";
    currentPunchScore = 0;
    maxPunchScore = 0;
    punchTimer = 0;
    gameInterval = setInterval(boxingLoop, 1000 / 60);
}

function boxingLoop() {
    // Берем модуль ускорения по всем осям
    let totalAccel = Math.hypot(accel.x, accel.y, accel.z);

    if (punchState === "ready") {
        // Ужасный порог 22.0 — нужен молниеносный мощнейший удар об стол или резкий бросок
        if (totalAccel > 22.0) {
            punchState = "punching";
            
            // Очень жесткая формула, на выходе максимум копейки для слабых ударов
            currentPunchScore = Math.floor(Math.pow(totalAccel, 1.1) * 3 + Math.random() * 10);
            if (currentPunchScore > 999) currentPunchScore = 999;
            
            if (currentPunchScore > maxPunchScore) {
                maxPunchScore = currentPunchScore;
            }
            punchTimer = 90;
        }
    } else if (punchState === "punching") {
        punchTimer--;
        if (punchTimer <= 0) {
            punchState = "ready";
        }
    }

    clearCanvas();

    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🥊 МЕГА-СИЛОМЕР (ХАРДКОР) 🥊", 450, 80);

    if (punchState === "ready") {
        ctx.fillStyle = "#ff2222";
        ctx.font = "24px Arial";
        ctx.fillText("МОЛОТИ СО ВСЕЙ ДУРИ! (Порог > 22.0)", 450, 160);

        if (maxPunchScore > 0) {
            ctx.fillStyle = "gold";
            ctx.font = "20px Arial";
            ctx.fillText("Рекорд: " + maxPunchScore, 450, 220);
        }
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(250, 150, 400, 180);
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 6;
        ctx.strokeRect(250, 150, 400, 180);

        ctx.fillStyle = "#ff2222";
        ctx.font = "bold 80px monospace";
        ctx.fillText(currentPunchScore, 450, 270);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("РЕЗУЛЬТАТ УДАРА!", 450, 360);
    }
    
    ctx.textAlign = "left";
}


// ==================== 5. CRAZY FROG (ИСПРАВЛЕНО: Четкий прыжок на резкий взмах вверх) ====================
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
    // Прыжок срабатывает, когда акселерометр Y резко уходит в минус (резкий взвок пульта вверх)
    if (!isJumping && accel.y < -5.0) {
        frogVy = -13;
        isJumping = true;
    }

    frogVy += 0.55; // Гравитация
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
        obstacles[i].x -= 7;

        // Коллизия с препятствием
        if (
            obstacles[i].x < 185 &&
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

    // Земля
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 420, 900, 80);

    // Лягушка
    ctx.fillStyle = "#22bb22";
    ctx.fillRect(150, frogY, 40, 40);

    // Препятствия
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
