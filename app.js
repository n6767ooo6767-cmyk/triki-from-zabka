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

let gyro = {
    x:0,
    y:0,
    z:0
};

let accel = {
    x:0,
    y:0,
    z:0
};


// GAME

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


let currentGame = null;


// PONG

let playerY = 200;
let enemyY = 200;

let ball = {
    x:450,
    y:250,
    vx:5,
    vy:3
};


function startPong(){

    currentGame="pong";

    document.getElementById("menu").style.display="none";
    document.getElementById("back").style.display="block";

    gameLoop();
}


function pong(){

    playerY += accel.y * 8;


    if(playerY < 0)
        playerY = 0;

    if(playerY > 400)
        playerY = 400;


    enemyY += (ball.y - enemyY - 50) * 0.05;


    ball.x += ball.vx;
    ball.y += ball.vy;


    if(ball.y < 0 || ball.y > 500)
        ball.vy *= -1;


    if(
        ball.x < 35 &&
        ball.y > playerY &&
        ball.y < playerY+100
    )
        ball.vx *= -1;


    if(
        ball.x > 850 &&
        ball.y > enemyY &&
        ball.y < enemyY+100
    )
        ball.vx *= -1;


    if(ball.x < 0 || ball.x > 900){

        ball.x=450;
        ball.y=250;

        ball.vx *= -1;
    }



    ctx.fillStyle="black";
    ctx.fillRect(0,0,900,500);


    ctx.fillStyle="white";


    ctx.fillRect(
        20,
        playerY,
        15,
        100
    );


    ctx.fillRect(
        865,
        enemyY,
        15,
        100
    );


    ctx.beginPath();
    ctx.arc(
        ball.x,
        ball.y,
        10,
        0,
        Math.PI*2
    );

    ctx.fill();

}



// LOOP

function gameLoop(){

    if(currentGame==="pong")
        pong();


    requestAnimationFrame(gameLoop);
}



// BLE

document.getElementById("connect").onclick = async ()=>{


    const device = await navigator.bluetooth.requestDevice({

        filters:[
            {
                namePrefix:"Triki"
            }
        ],

        optionalServices:[
            SERVICE
        ]

    });


    const server = await device.gatt.connect();


    const service =
        await server.getPrimaryService(SERVICE);


    trikiRX =
        await service.getCharacteristic(RX);


    const tx =
        await service.getCharacteristic(TX);



    await tx.startNotifications();



    tx.addEventListener(
        "characteristicvaluechanged",
        e=>{


        const d =
            new Uint8Array(
                e.target.value.buffer
            );


        if(d.length < 14)
            return;


        if(d[0]!==0x22 || d[1]!==0x00)
            return;



        const dv =
            new DataView(d.buffer);



        gyro.x =
            dv.getInt16(2,true)/131;

        gyro.y =
            dv.getInt16(4,true)/131;

        gyro.z =
            dv.getInt16(6,true)/131;



        accel.x =
            dv.getInt16(8,true)/2048;

        accel.y =
            dv.getInt16(10,true)/2048;

        accel.z =
            dv.getInt16(12,true)/2048;


        });


    await trikiRX.writeValueWithoutResponse(
        START
    );


    connected=true;


    document.getElementById("status").innerHTML =
        "🟢 Connected";

};



// BUTTONS


document.getElementById("pong")
.onclick=startPong;



document.getElementById("back")
.onclick=()=>{

    currentGame=null;

    document.getElementById("menu").style.display="block";

    document.getElementById("back").style.display="none";

};
