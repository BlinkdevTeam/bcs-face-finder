const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let backendProcess = null;
let mainWindow = null;

// Absolute Python path inside your project
const PYTHON_PATH = path.join(
  __dirname,
  "../.venv/bin/python"
);

// Backend entry point
const BACKEND_SCRIPT = path.join(
  __dirname,
  "../backend/api.py"
);

// Wait until backend is ready (HTTP 8000)
async function waitForBackend() {
  const http = require("http");

  return new Promise((resolve) => {
    const check = () => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: 8000,
          path: "/folders",
          method: "GET",
          timeout: 2000,
        },
        (res) => {
          resolve(true);
        }
      );

      req.on("error", () => setTimeout(check, 500));
      req.on("timeout", () => setTimeout(check, 500));
      req.end();
    };

    check();
  });
}

function startBackend() {
  console.log("🚀 Starting backend…");

  backendProcess = spawn(PYTHON_PATH, [BACKEND_SCRIPT], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      DB_HOST: "localhost",
      DB_USER: "postgres",
      DB_PASSWORD: "blinkdatabase",
      DB_NAME: "SampleDatabase",
    },
    stdio: "inherit",
  });

  backendProcess.on("close", (code) => {
    console.log(`❌ Backend exited with code ${code}`);
  });
}

async function createWindow() {
  // Start backend
  startBackend();

  // Wait until backend is ready
  console.log("⏳ Waiting for backend to be ready…");
  await waitForBackend();
  console.log("✅ Backend is ready!");

  // Load frontend
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  const indexPath = path.join(__dirname, "../frontend/dist/index.html");

  console.log("📄 Loading:", indexPath);

  mainWindow.loadFile(indexPath);
}

app.whenReady().then(createWindow);

app.on("quit", () => {
  if (backendProcess) backendProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});
