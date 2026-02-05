const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // Correct path to your React build:
    const indexPath = path.join(
        __dirname,
        "..",
        "frontend",
        "dist",
        "index.html"
    );

    console.log("🟦 Loading file:", indexPath);

    if (!fs.existsSync(indexPath)) {
        console.error("❌ index.html NOT FOUND at:", indexPath);
        win.loadURL("data:text/html,<h1>ERROR: index.html NOT FOUND</h1>");
        return;
    }

    win.loadFile(indexPath);
}

app.whenReady().then(() => {
    console.log("🚀 BCS Face Finder starting…");
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
