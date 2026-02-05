const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// ---- START FASTAPI BACKEND ----
function startBackend() {
  const backend = spawn("python3", ["api.py"], {
    cwd: path.join(__dirname, "../backend"),
    detached: true,
    stdio: "ignore" // hide terminal
  });

  backend.unref();
  console.log("🚀 FastAPI backend started");
}

// ---- WAIT FOR BACKEND TO RESPOND ----
async function waitForBackend() {
  const url = "http://localhost:8000/docs";

  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// ---- CREATE THE APP WINDOW ----
async function createWindow() {
  await waitForBackend();

  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    title: "BCS Face Finder",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadURL("http://localhost:5173"); // React dev server
}

// ---- APP LIFECYCLE ----
app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
