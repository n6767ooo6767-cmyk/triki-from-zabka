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

let triki1 = { server: null, rx: null, tx: null, accel: { x: 0, y: 0, z: 0 }, connected: false, deviceId: null };
let triki2 = { server: null, rx: null, tx: null, accel: { x: 0, y: 0, z: 0 }, connected: false, deviceId: null };

let accel = { x: 0, y: 0, z: 0 };
let connected = false;

let punchDifficulty = "hard"; 

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
    snakeDir = { x: 2, y: 0 };
    gameInterval = setInterval(snakeLoop, 1000 / 30);
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * 42) * 20 + 30,
        y: Math.floor(Math.random() * 22) * 20 + 30
    };
}

function snakeLoop() {
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


// ==================== 3. TOSS ====================
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
    tossBall.x += accel.x * 3.5;
    tossBall.y += accel.y * 3.5;

    if (tossBall.x < 20) tossBall.x = 20;
    if (tossBall.x > 880) tossBall.x = 880;
    if (tossBall.y < 20) tossBall.y = 20;
    if (tossBall.y > 480) tossBall.y = 480;

    let dist = Math.hypot(tossBall.x - tossTarget.x, tossBall.y - tossTarget.y);
    if (dist < tossTarget.radius + 15) {
        tossScore++;
        spawnTossTarget();
    }

    clearCanvas();
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(tossTarget.x, tossTarget.y, tossTarget.radius, 0, Math.PI * 2);
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
let punchState = "ready"; 
let currentPunchScore = 0;
let maxPunchScore = 0;
let punchTimer = 0;

function setBoxingDifficulty(diff) {
    punchDifficulty = diff;
    ['easy', 'medium', 'hard', 'impossible'].forEach(d => {
        const btn = document.getElementById("diff_" + d);
        if (btn) {
            btn.style.border = (d === diff) ? "3px solid #ffcc00" : "1px solid #555";
            btn.style.background = (d === diff) ? "#333" : "#222";
        }
    });
}

function startBoxing() {
    setupGame("boxing");
    punchState = "ready";
    currentPunchScore = 0;
    maxPunchScore = 0;
    punchTimer = 0;
    gameInterval = setInterval(boxingLoop, 1000 / 60);
}

function boxingLoop() {
    let totalAccel = Math.hypot(accel.x, accel.y, accel.z);

    let threshold = 5.0;
    let multiplier = 40.0;
    let powerExp = 1.0;

    if (punchDifficulty === "easy") {
        threshold = 4.0;
        multiplier = 60.0;
        powerExp = 0.9;
    } else if (punchDifficulty === "medium") {
        threshold = 10.0;
        multiplier = 25.0;
        powerExp = 1.1;
    } else if (punchDifficulty === "hard") {
        threshold = 22.0;
        multiplier = 10.0;
        powerExp = 1.25;
    } else if (punchDifficulty === "impossible") {
        threshold = 38.0;
        multiplier = 4.5;
        powerExp = 1.15;
    }

    if (punchState === "ready") {
        if (totalAccel > threshold) {
            punchState = "punching";
            
            currentPunchScore = Math.floor(Math.pow(totalAccel, powerExp) * multiplier + Math.random() * 5);
            if (currentPunchScore > 999) currentPunchScore = 999;
            if (currentPunchScore < 1) currentPunchScore = 1;
            
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
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🥊 СИЛОМЕР [" + punchDifficulty.toUpperCase() + "] 🥊", 450, 60);

    if (punchState === "ready") {
        ctx.fillStyle = "#ff2222";
        ctx.font = "20px Arial";
        ctx.fillText("Порог удара > " + threshold + ". Бей!", 450, 110);

        if (maxPunchScore > 0) {
            ctx.fillStyle = "gold";
            ctx.font = "20px Arial";
            ctx.fillText("Рекорд: " + maxPunchScore, 450, 150);
        }
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(250, 130, 400, 180);
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 6;
        ctx.strokeRect(250, 130, 400, 180);

        ctx.fillStyle = "#ff2222";
        ctx.font = "bold 80px monospace";
        ctx.fillText(currentPunchScore, 450, 250);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("РЕЗУЛЬТАТ!", 450, 340);
    }
    
    ctx.textAlign = "left";
}


// ==================== 5. CRAZY FROG (ИСПРАВЛЕНО: ТРЕБУЕТ РЕЗКОГО УДАРА, А НЕ ПЛАВНОЙ ТРЯСКИ) ====================
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
    let totalAccel = Math.hypot(accel.x, accel.y, accel.z);

    // Изменено: теперь прыжок срабатывает только при резком ударе (общая сила > 18.0)
    if (!isJumping && totalAccel > 18.0) {
        frogVy = -14;
        isJumping = true;
    }

    frogVy += 0.55;
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


// ==================== 6. 1V1 PONG ====================
let p1Y = 200;
let p2Y = 200;
let ball1v1 = { x: 450, y: 250, vx: 5, vy: 3 };
let score1 = 0;
let score2 = 0;

function start1v1() {
    if (!triki1.connected || !triki2.connected) {
        alert("Для режима 1v1 нужно подключить ровно 2 разных пульта Triki!");
        return;
    }
    setupGame("duel");
    p1Y = 200;
    p2Y = 200;
    ball1v1 = { x: 450, y: 250, vx: 6, vy: 4 };
    score1 = 0;
    score2 = 0;
    gameInterval = setInterval(duelLoop, 1000 / 60);
}

function duelLoop() {
    p1Y += triki1.accel.y * 8;
    if (p1Y < 0) p1Y = 0;
    if (p1Y > 400) p1Y = 400;

    p2Y += triki2.accel.y * 8;
    if (p2Y < 0) p2Y = 0;
    if (p2Y > 400) p2Y = 400;

    ball1v1.x += ball1v1.vx;
    ball1v1.y += ball1v1.vy;

    if (ball1v1.y < 0 || ball1v1.y > 500) ball1v1.vy *= -1;

    if (ball1v1.x < 35 && ball1v1.y > p1Y && ball1v1.y < p1Y + 100) {
        ball1v1.vx *= -1;
        ball1v1.vx *= 1.05;
    }

    if (ball1v1.x > 865 && ball1v1.y > p2Y && ball1v1.y < p2Y + 100) {
        ball1v1.vx *= -1;
        ball1v1.vx *= 1.05;
    }

    if (ball1v1.x < 0) {
        score2++;
        resetBall1v1(-1);
    }
    if (ball1v1.x > 900) {
        score1++;
        resetBall1v1(1);
    }

    clearCanvas();

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, 500);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#2d7cff";
    ctx.fillRect(20, p1Y, 15, 100);

    ctx.fillStyle = "#ff3333";
    ctx.fillRect(865, p2Y, 15, 100);

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball1v1.x, ball1v1.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2d7cff";
    ctx.font = "32px Arial";
    ctx.fillText("P1: " + score1, 250, 50);

    ctx.fillStyle = "#ff3333";
    ctx.fillText("P2: " + score2, 580, 50);
}

function resetBall1v1(dir) {
    ball1v1.x = 450;
    ball1v1.y = 250;
    ball1v1.vx = 6 * dir;
    ball1v1.vy = (Math.random() - 0.5) * 6;
}


// ==================== BLE CONNECTIONS ====================

document.getElementById("connect").onclick = async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Triki" }],
            optionalServices: [SERVICE]
        });

        if (triki2.connected && triki2.deviceId === device.id) {
            alert("Этот пульт Triki уже подключен как Игрок 2!");
            return;
        }

        triki1.server = await device.gatt.connect();
        triki1.deviceId = device.id;
        const service = await triki1.server.getPrimaryService(SERVICE);
        triki1.rx = await service.getCharacteristic(RX);
        const tx = await service.getCharacteristic(TX);

        await tx.startNotifications();

        tx.addEventListener("characteristicvaluechanged", e => {
            const d = new Uint8Array(e.target.value.buffer);
            if (d.length < 14) return;
            if (d[0] !== 0x22 || d[1] !== 0x00) return;

            const dv = new DataView(d.buffer);
            triki1.accel.x = dv.getInt16(8, true) / 2048;
            triki1.accel.y = dv.getInt16(10, true) / 2048;
            triki1.accel.z = dv.getInt16(12, true) / 2048;

            accel = triki1.accel;
        });

        await triki1.rx.writeValueWithoutResponse(START);
        triki1.connected = true;
        connected = true;
        updateStatus();
    } catch (err) {
        console.error("Bluetooth 1 failed:", err);
    }
};

document.getElementById("connect2") ? document.getElementById("connect2").onclick = async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Triki" }],
            optionalServices: [SERVICE]
        });

        if (triki1.connected && triki1.deviceId === device.id) {
            alert("Этот пульт Triki уже подключен как Игрок 1!");
            return;
        }

        triki2.server = await device.gatt.connect();
        triki2.deviceId = device.id;
        const service = await triki2.server.getPrimaryService(SERVICE);
        triki2.rx = await service.getCharacteristic(RX);
        const tx = await service.getCharacteristic(TX);

        await tx.startNotifications();

        tx.addEventListener("characteristicvaluechanged", e => {
            const d = new Uint8Array(e.target.value.buffer);
            if (d.length < 14) return;
            if (d[0] !== 0x22 || d[1] !== 0x00) return;

            const dv = new DataView(d.buffer);
            triki2.accel.x = dv.getInt16(8, true) / 2048;
            triki2.accel.y = dv.getInt16(10, true) / 2048;
            triki2.accel.z = dv.getInt16(12, true) / 2048;
        });

        await triki2.rx.writeValueWithoutResponse(START);
        triki2.connected = true;
        updateStatus();
    } catch (err) {
        console.error("Bluetooth 2 failed:", err);
    }
} : null;

document.getElementById("disconnect").onclick = () => {
    if (triki1.server && triki1.server.connected) {
        triki1.server.disconnect();
    }
    if (triki2.server && triki2.server.connected) {
        triki2.server.disconnect();
    }
    triki1.connected = false;
    triki1.deviceId = null;
    triki2.connected = false;
    triki2.deviceId = null;
    connected = false;
    updateStatus();
};

function updateStatus() {
    let statusText = "🔴 Disconnected";
    if (triki1.connected && triki2.connected) {
        statusText = "🟢🟢 Connected (2 Triki)";
    } else if (triki1.connected) {
        statusText = "🟢 Connected (1 Triki)";
    }
    document.getElementById("status").innerHTML = statusText;
}


// ==================== UI BUTTONS BINDING ====================

document.getElementById("pong").onclick = startPong;
document.getElementById("snake").onclick = startSnake;
document.getElementById("toss").onclick = startToss;
document.getElementById("boxing").onclick = startBoxing;
document.getElementById("frog").onclick = startFrog;
document.getElementById("duel1v1") ? document.getElementById("duel1v1").onclick = start1v1 : null;

['easy', 'medium', 'hard', 'impossible'].forEach(d => {
    const btn = document.getElementById("diff_" + d);
    if (btn) {
        btn.onclick = () => setBoxingDifficulty(d);
    }
});

document.getElementById("back").onclick = () => {
    if (gameInterval) clearInterval(gameInterval);
    currentGame = null;
    clearCanvas();
    document.getElementById("menu").style.display = "block";
    document.getElementById("back").style.display = "none";
};
