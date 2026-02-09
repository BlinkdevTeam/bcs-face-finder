const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let pyProc = null;
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  const frontendDir = path.join(__dirname, "..", "frontend", "dist");
  const indexFile = path.join(frontendDir, "index.html");

  win.loadFile(indexFile);
}

function startPython() {
  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");

  const py = spawn("python3", ["api.py"], { cwd: backendDir });

  py.stdout.on("data", d => console.log("PYTHON:", d.toString()));
  py.stderr.on("data", d => console.error("PYTHON ERR:", d.toString()));

  return py;
}

function scanNAS() {
  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");

  spawn("python3", ["scan_nas.py"], { cwd: backendDir });
}

app.whenReady().then(() => {
  pyProc = startPython();
  setTimeout(scanNAS, 2000);
  setTimeout(createWindow, 3000);
});

app.on("will-quit", () => {
  if (pyProc) pyProc.kill();
});
