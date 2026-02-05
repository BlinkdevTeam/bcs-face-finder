const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let pyProcess = null;

function startPythonBackend() {
  const pythonPath = process.platform === "win32" ? "python" : "python3";

  const backendPath = path.join(__dirname, "../backend/api.py");

  pyProcess = spawn(pythonPath, [backendPath], {
    cwd: path.join(__dirname, "../backend"),
    env: { ...process.env },
  });

  pyProcess.stdout.on("data", (data) => {
    console.log(`[PYTHON] ${data}`);
  });

  pyProcess.stderr.on("data", (data) => {
    console.error(`[PYTHON ERROR] ${data}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
}

app.whenReady().then(() => {
  startPythonBackend();

  // Wait 1 second then load UI
  setTimeout(() => {
    createWindow();
  }, 1200);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (pyProcess) {
    pyProcess.kill();
  }
  if (process.platform !== "darwin") app.quit();
});
