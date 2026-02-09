const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let backendProcess = null;
let win = null;

/* ===============================
   Resolve backend directory
   =============================== */
function getBackendDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "backend");
}

/* ===============================
   Start Python backend silently
   =============================== */
function startBackend() {
  const backendDir = getBackendDir();
  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  backendProcess = spawn(pythonCmd, ["api.py"], {
    cwd: backendDir,
    stdio: "ignore",   // prevent terminal window
    detached: false,
  });
}

/* ===============================
   Create the main window
   =============================== */
function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // IMPORTANT for packaged builds
    },
  });

  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "frontend", "dist", "index.html")
    : path.join(__dirname, "frontend", "dist", "index.html");

  win.loadFile(indexPath);
}

/* ===============================
   App ready
   =============================== */
app.whenReady().then(() => {
  startBackend();
  setTimeout(createWindow, 1200); // give backend time to boot
});

/* ===============================
   Cleanup backend when quitting
   =============================== */
app.on("before-quit", () => {
  if (backendProcess) backendProcess.kill();
});
