const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;
let watcher;
let autoScreenshotInterval = null;
let lastScreenshotPath = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Shared state for MCP server
const STATE_FILE = path.join(os.tmpdir(), 'tarkov-tracker-state.json');
let sharedState = {
  currentMap: 'customs',
  position: null,
  positionHistory: [],
  status: { watching: false }
};

function writeSharedState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2));
  } catch (err) {
    console.error('Failed to write shared state:', err);
  }
}

// Screenshot folder path
const SCREENSHOTS_PATH = path.join(
  os.homedir(),
  'Documents',
  'Escape From Tarkov',
  'Screenshots'
);

// Regex to parse EFT screenshot filenames
const POSITION_REGEX = /\d{4}-\d{2}-\d{2}\[\d{2}-\d{2}\]_(?<x>-?[\d.]+),\s*(?<y>-?[\d.]+),\s*(?<z>-?[\d.]+)_(?<qx>-?[\d.]+),\s*(?<qy>-?[\d.]+),\s*(?<qz>-?[\d.]+),\s*(?<qw>-?[\d.]+)/;

function quaternionToYaw(qx, qy, qz, qw) {
  const siny_cosp = 2.0 * (qw * qy + qx * qz);
  const cosy_cosp = 1.0 - 2.0 * (qy * qy + qz * qz);
  let yaw = Math.atan2(siny_cosp, cosy_cosp);
  return yaw * (180.0 / Math.PI);
}

// Simulate PrintScreen key press using PowerShell
function simulatePrintScreen() {
  // Use PowerShell to send PrintScreen key
  const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{PRTSC}')"`;

  exec(psCommand, (error) => {
    if (error) {
      console.error('Failed to simulate PrintScreen:', error);
    }
  });
}

// Delete old screenshot after new one is captured
function deleteOldScreenshot(newPath) {
  if (lastScreenshotPath && lastScreenshotPath !== newPath && fs.existsSync(lastScreenshotPath)) {
    try {
      fs.unlinkSync(lastScreenshotPath);
      console.log('Deleted old screenshot:', path.basename(lastScreenshotPath));
    } catch (err) {
      console.error('Failed to delete old screenshot:', err);
    }
  }
  lastScreenshotPath = newPath;
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    x: width - 920,
    y: 20,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopAutoScreenshot();
  });
}

function startWatcher() {
  if (!fs.existsSync(SCREENSHOTS_PATH)) {
    console.log('Screenshots folder not found:', SCREENSHOTS_PATH);
    // Try to create the folder
    try {
      fs.mkdirSync(SCREENSHOTS_PATH, { recursive: true });
      console.log('Created screenshots folder');
    } catch (err) {
      mainWindow?.webContents.send('status', {
        watching: false,
        error: 'Screenshots folder not found'
      });
      return;
    }
  }

  console.log('Watching:', SCREENSHOTS_PATH);

  watcher = chokidar.watch(SCREENSHOTS_PATH, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  watcher.on('add', (filepath) => {
    const filename = path.basename(filepath);
    const match = filename.match(POSITION_REGEX);

    if (match?.groups) {
      const { x, y, z, qx, qy, qz, qw } = match.groups;
      const rotation = quaternionToYaw(
        parseFloat(qx),
        parseFloat(qy),
        parseFloat(qz),
        parseFloat(qw)
      );

      const position = {
        x: parseFloat(x),
        y: parseFloat(y),
        z: parseFloat(z),
        rotation,
        timestamp: Date.now()
      };

      console.log('Position:', position);
      mainWindow?.webContents.send('position', position);

      // Update shared state for MCP
      sharedState.position = position;
      sharedState.positionHistory = [...sharedState.positionHistory.slice(-49), position];
      writeSharedState();

      // Delete old screenshot after processing new one
      deleteOldScreenshot(filepath);
    }
  });

  sharedState.status = { watching: true, path: SCREENSHOTS_PATH };
  writeSharedState();

  mainWindow?.webContents.send('status', {
    watching: true,
    path: SCREENSHOTS_PATH
  });
}

// Handle map change from renderer
ipcMain.on('change-map', (event, mapName) => {
  sharedState.currentMap = mapName;
  sharedState.position = null;
  sharedState.positionHistory = [];
  writeSharedState();
});

// Auto screenshot functions
function startAutoScreenshot(intervalMs = 2500) {
  if (autoScreenshotInterval) {
    clearInterval(autoScreenshotInterval);
  }

  console.log(`Starting auto-screenshot every ${intervalMs}ms`);

  // Take first screenshot immediately
  simulatePrintScreen();

  autoScreenshotInterval = setInterval(() => {
    simulatePrintScreen();
  }, intervalMs);

  mainWindow?.webContents.send('auto-screenshot-status', { enabled: true, interval: intervalMs });
}

function stopAutoScreenshot() {
  if (autoScreenshotInterval) {
    clearInterval(autoScreenshotInterval);
    autoScreenshotInterval = null;
    console.log('Stopped auto-screenshot');
  }
  mainWindow?.webContents.send('auto-screenshot-status', { enabled: false });
}

// Clean up all screenshots in folder (optional)
function cleanupScreenshots() {
  if (!fs.existsSync(SCREENSHOTS_PATH)) return;

  const files = fs.readdirSync(SCREENSHOTS_PATH);
  let deleted = 0;

  files.forEach(file => {
    if (POSITION_REGEX.test(file)) {
      try {
        fs.unlinkSync(path.join(SCREENSHOTS_PATH, file));
        deleted++;
      } catch (err) {
        console.error('Failed to delete:', file);
      }
    }
  });

  console.log(`Cleaned up ${deleted} screenshots`);
  return deleted;
}

// IPC handlers
ipcMain.on('toggle-always-on-top', (event, value) => {
  mainWindow?.setAlwaysOnTop(value);
});

ipcMain.on('set-opacity', (event, value) => {
  mainWindow?.setOpacity(value);
});

ipcMain.on('minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('close', () => {
  app.quit();
});

// Auto screenshot controls
ipcMain.on('start-auto-screenshot', (event, intervalMs) => {
  startAutoScreenshot(intervalMs || 2500);
});

ipcMain.on('stop-auto-screenshot', () => {
  stopAutoScreenshot();
});

ipcMain.on('toggle-auto-screenshot', (event, { enabled, interval }) => {
  if (enabled) {
    startAutoScreenshot(interval || 2500);
  } else {
    stopAutoScreenshot();
  }
});

ipcMain.on('cleanup-screenshots', () => {
  const count = cleanupScreenshots();
  mainWindow?.webContents.send('cleanup-complete', count);
});

ipcMain.on('take-screenshot', () => {
  simulatePrintScreen();
});

app.whenReady().then(() => {
  createWindow();
  startWatcher();
});

app.on('window-all-closed', () => {
  stopAutoScreenshot();
  if (watcher) watcher.close();
  app.quit();
});

app.on('will-quit', () => {
  stopAutoScreenshot();
  globalShortcut.unregisterAll();
});
