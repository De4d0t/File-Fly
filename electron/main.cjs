const { app, BrowserWindow, ipcMain, dialog, shell, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const { pathToFileURL } = require('url');

process.on('uncaughtException', (err) => {
  console.error('[Electron Main Uncaught]', err);
  try {
    fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[MAIN CRASH] ${err?.stack || err}\n`);
  } catch (_) {}
});

process.on('unhandledRejection', (err) => {
  console.error('[Electron Main Rejection]', err);
  try {
    fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[MAIN REJECTION] ${err?.stack || err}\n`);
  } catch (_) {}
});

// Start background Express/WebSocket server automatically
try {
  const serverScript = path.join(__dirname, '..', 'server', 'index.js');
  if (fs.existsSync(serverScript)) {
    import(pathToFileURL(serverScript).href).catch((err) => {
      console.warn('[FileFly Backend] Server notice:', err?.message || err);
      try {
        fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[BACKEND ERROR] ${err?.stack || err}\n`);
      } catch (_) {}
    });
  }
} catch (err) {
  console.error('[FileFly Backend] Import failed:', err);
}

// Register standard Windows App ID so Taskbar icon and notifications group properly
if (process.platform === 'win32') {
  app.setAppUserModelId('com.filefly.app');
}

let mainWindow = null;

function createWindow() {
  const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');
  const pngPath = path.join(__dirname, '..', 'public', 'icon-512.png');
  let windowIcon = null;
  if (fs.existsSync(icoPath)) {
    windowIcon = nativeImage.createFromPath(icoPath);
  } else if (fs.existsSync(pngPath)) {
    windowIcon = nativeImage.createFromPath(pngPath);
  }

  mainWindow = new BrowserWindow({
    width: 580,
    height: 750,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    center: true,
    frame: false,
    icon: windowIcon,
    titleBarStyle: 'hidden',
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  if (windowIcon && !windowIcon.isEmpty()) {
    mainWindow.setIcon(windowIcon);
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const logLine = `[Level ${level}] ${message} at ${sourceId}:${line}\n`;
    try {
      fs.appendFileSync(path.join(__dirname, 'renderer.log'), logLine);
    } catch (_) {}
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    try {
      fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[LOAD FAILED] Code ${errorCode}: ${errorDescription} (${validatedURL})\n`);
    } catch (_) {}
  });

  // By default, load production server on port 53316. Only load Vite 5173 if explicitly in VITE_DEV mode
  const isViteDev = process.env.VITE_DEV === '1' || process.env.ELECTRON_DEV === '1';
  const startUrl = isViteDev ? 'http://localhost:5173' : 'http://localhost:53316';

  const loadApp = () => {
    mainWindow.loadURL(startUrl).catch(() => {
      setTimeout(loadApp, 400);
    });
  };
  loadApp();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

// File picker dialogs
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
  });
  return result.filePaths;
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths;
});

// File and Folder OS integrations
ipcMain.handle('shell:openFile', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    return await shell.openPath(filePath);
  }
  return 'File not found';
});

ipcMain.handle('shell:showInFolder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  const downloads = app.getPath('downloads');
  shell.openPath(downloads);
  return false;
});

ipcMain.handle('shell:openDownloads', async (event, dirPath) => {
  const target = dirPath && fs.existsSync(dirPath) ? dirPath : app.getPath('downloads');
  return await shell.openPath(target);
});

// Native File Drag & Drop to Windows Desktop / Explorer
ipcMain.on('ondragstart', (event, filePath) => {
  let targetPath = filePath;
  const downloadsDir = app.getPath('downloads');

  if (!targetPath || !fs.existsSync(targetPath)) {
    const base = path.basename(filePath || '');
    const inFolder = path.join(downloadsDir, 'FileFly', base);
    const inDownloads = path.join(downloadsDir, base);
    if (fs.existsSync(inFolder)) {
      targetPath = inFolder;
    } else if (fs.existsSync(inDownloads)) {
      targetPath = inDownloads;
    }
  }

  try {
    fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[DRAG] filePath=${filePath} resolved=${targetPath} exists=${fs.existsSync(targetPath || '')}\n`);
  } catch (_) {}

  if (targetPath && fs.existsSync(targetPath)) {
    const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');
    const pngPath = path.join(__dirname, '..', 'public', 'icon-512.png');
    let dragIcon = null;
    if (fs.existsSync(icoPath)) {
      dragIcon = nativeImage.createFromPath(icoPath);
    } else if (fs.existsSync(pngPath)) {
      dragIcon = nativeImage.createFromPath(pngPath);
    } else {
      dragIcon = nativeImage.createEmpty();
    }

    if (dragIcon && !dragIcon.isEmpty()) {
      try {
        dragIcon = dragIcon.resize({ width: 48, height: 48 });
      } catch (_) {}
    }

    try {
      event.sender.startDrag({
        file: path.resolve(targetPath),
        icon: dragIcon,
      });
      fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[DRAG SUCCESS] started dragging ${targetPath}\n`);
    } catch (err) {
      fs.appendFileSync(path.join(__dirname, 'renderer.log'), `[DRAG ERROR] ${err.message}\n`);
    }
  }
});

// System Notifications
ipcMain.on('notify', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
