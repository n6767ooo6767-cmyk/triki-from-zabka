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

const log = document.getElementById("log");

document.getElementById("connect").onclick = async () => {

    const device = await navigator.bluetooth.requestDevice({
        filters: [{namePrefix:"Triki"}],
        optionalServices:[SERVICE]
    });

    const server = await device.gatt.connect();

    const service = await server.getPrimaryService(SERVICE);

    const rx = await service.getCharacteristic(RX);
    const tx = await service.getCharacteristic(TX);

    await tx.startNotifications();

    tx.addEventListener("characteristicvaluechanged", e=>{

        const d = new Uint8Array(e.target.value.buffer);

        if(d.length<14) return;

        if(d[0]!=0x22 || d[1]!=0x00) return;

        const dv = new DataView(d.buffer);

        const gx=dv.getInt16(2,true)/131;
        const gy=dv.getInt16(4,true)/131;
        const gz=dv.getInt16(6,true)/131;

        const ax=dv.getInt16(8,true)/2048;
        const ay=dv.getInt16(10,true)/2048;
        const az=dv.getInt16(12,true)/2048;

        log.textContent=
`GYRO

X ${gx.toFixed(2)}
Y ${gy.toFixed(2)}
Z ${gz.toFixed(2)}

ACCEL

X ${ax.toFixed(2)}
Y ${ay.toFixed(2)}
Z ${az.toFixed(2)}
`;
    });

    await rx.writeValueWithoutResponse(START);

    log.textContent="Connected!";
}
