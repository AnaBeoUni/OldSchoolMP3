const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let win;

function createWindow() {
    const iconPath = path.join(__dirname, "icons", "app.ico");

    win = new BrowserWindow({
        width: 360,
        height: 335,

        frame: false,
        transparent: true,
        alwaysOnTop: true,
        icon: iconPath,

        resizable: true,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadURL("http://localhost:3000");
}

// Listen for height changes from React
ipcMain.on('resize-window', (event, height) => {
    if (win) {
        win.setSize(360, height);
    }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});