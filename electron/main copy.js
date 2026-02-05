const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let pythonProcess = null;
let win = null;

function startPythonBackend() {
  const backendPath = path.join(__dirname, "../backend/api.py");

  pythonProcess = spawn("python3", [backendPath], {
    cwd: path.join(__dirname, "../backend"),
    shell: false,
    stdio: "inherit"
  });

  pythonProcess.on("close", (code) => {
    console.log("Python backend exited with code:", code);
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (pythonProcess) pythonProcess.kill();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
