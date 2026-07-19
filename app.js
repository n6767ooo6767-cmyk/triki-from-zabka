const button = document.getElementById("connect");
const status = document.getElementById("status");

button.addEventListener("click", async () => {

    if (!navigator.bluetooth) {
        status.textContent = "❌ Web Bluetooth не поддерживается";
        return;
    }

    try {

        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: []
        });

        status.textContent = "✅ " + (device.name || "Triki");

    } catch {

        status.textContent = "Подключение отменено";

    }

});
