const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const http = require("http");
const path = require("path");

const APP_ROOT = path.join(__dirname, "..");
let staticServer;
let staticPort;
let mainWindow;
let updateCheckInProgress = false;
let updateReadyToInstall = false;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function log(message, error) {
  try {
    const dir = app.getPath("userData");
    fs.mkdirSync(dir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${message}${error ? `\n${error.stack || error.message || String(error)}` : ""}\n`;
    fs.appendFileSync(path.join(dir, "youdesign.log"), line);
  } catch (_) {}
}

process.on("uncaughtException", error => {
  log("Uncaught exception", error);
});

process.on("unhandledRejection", error => {
  log("Unhandled rejection", error);
});

function sendUpdateStatus(status, data = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("youdesign:update-status", { status, ...data });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml; charset=utf-8",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf"
  }[ext] || "application/octet-stream";
}

function safePathFromUrl(url) {
  const decoded = decodeURIComponent(new URL(url, "http://127.0.0.1").pathname);
  const requested = decoded === "/" ? "index.html" : decoded.slice(1);
  const resolved = path.normalize(path.join(APP_ROOT, requested));
  if (!resolved.startsWith(APP_ROOT)) return null;
  return resolved;
}

function directoryListing(dirPath, requestPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => !entry.name.startsWith("."))
    .map(entry => {
      const href = `${requestPath.replace(/\/?$/, "/")}${encodeURIComponent(entry.name)}`;
      return `<a href="${href}">${entry.name}</a>`;
    })
    .join("\n");
  return `<!doctype html><meta charset="utf-8">${entries}`;
}

function startStaticServer() {
  if (staticServer) return Promise.resolve(staticPort);

  staticServer = http.createServer((req, res) => {
    const filePath = safePathFromUrl(req.url);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      if (stat.isDirectory()) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(directoryListing(filePath, new URL(req.url, "http://127.0.0.1").pathname));
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "no-store"
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    staticServer.once("error", error => {
      log("Static server failed", error);
      reject(error);
    });
    staticServer.listen(0, "127.0.0.1", () => {
      staticPort = staticServer.address().port;
      log(`Static server started on port ${staticPort}`);
      resolve(staticPort);
    });
  });
}

async function createWindow() {
  log(`Creating window. packaged=${app.isPackaged}, platform=${process.platform}, appRoot=${APP_ROOT}`);
  const port = await startStaticServer();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "YOUDESIGN",
    backgroundColor: "#f5f5f7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    log(`Window failed to load: ${errorCode} ${errorDescription}`);
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);
  log("Window loaded");

  if (app.isPackaged) {
    setTimeout(() => checkForUpdates(false), 1800);
  }
}

async function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    sendUpdateStatus("dev-mode", { manual });
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        buttons: ["知道了"],
        message: "开发模式不会检查自动更新",
        detail: "打包发布后的应用会从 GitHub Releases 检查新版。"
      });
    }
    return;
  }

  if (updateCheckInProgress) return;
  updateCheckInProgress = true;
  sendUpdateStatus("checking", { manual });

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    updateCheckInProgress = false;
    sendUpdateStatus("error", { message: error.message, manual });
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: "error",
        buttons: ["知道了"],
        message: "检查更新失败",
        detail: error.message || "请稍后再试。"
      });
    }
  }
}

function setupAutoUpdater() {
  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus("checking");
  });

  autoUpdater.on("update-available", async info => {
    updateCheckInProgress = false;
    sendUpdateStatus("available", {
      version: info.version,
      releaseName: info.releaseName,
      releaseDate: info.releaseDate
    });

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["立即更新", "稍后"],
      defaultId: 0,
      cancelId: 1,
      message: `发现新版本 ${info.version}`,
      detail: "点击“立即更新”后会在后台下载更新包，下载完成后可重启安装。"
    });

    if (result.response === 0) {
      sendUpdateStatus("downloading", { percent: 0 });
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on("update-not-available", info => {
    updateCheckInProgress = false;
    sendUpdateStatus("not-available", { version: info.version });
  });

  autoUpdater.on("download-progress", progress => {
    sendUpdateStatus("downloading", {
      percent: Math.round(progress.percent || 0),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on("update-downloaded", async info => {
    updateReadyToInstall = true;
    createMenu();
    sendUpdateStatus("downloaded", { version: info.version });

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["重启并安装", "稍后"],
      defaultId: 0,
      cancelId: 1,
      message: "更新已下载完成",
      detail: `YOUDESIGN ${info.version} 已准备好，重启后会自动安装。`
    });

    if (result.response === 0) autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on("error", error => {
    updateCheckInProgress = false;
    sendUpdateStatus("error", { message: error.message });
  });
}

function createMenu() {
  const template = [
    {
      label: "YOUDESIGN",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "检查更新",
          click: () => checkForUpdates(true)
        },
        {
          label: "重启并安装更新",
          enabled: updateReadyToInstall,
          click: () => autoUpdater.quitAndInstall(false, true)
        },
        { type: "separator" },
        { role: "quit", label: "退出" }
      ]
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" }
      ]
    },
    {
      label: "视图",
      submenu: [
        { role: "reload", label: "重新载入" },
        { role: "toggleDevTools", label: "开发者工具" },
        { type: "separator" },
        { role: "resetZoom", label: "实际大小" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
        { type: "separator" },
        { role: "togglefullscreen", label: "全屏" }
      ]
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "打开发布页",
          click: () => shell.openExternal("https://github.com/kim-wing/social-cover-designer/releases/latest")
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  log(`App ready. version=${app.getVersion()}`);
  setupAutoUpdater();
  setupIpc();
  createMenu();
  createWindow().catch(error => {
    log("Failed to create main window", error);
    dialog.showErrorBox("YOUDESIGN 启动失败", error.message || String(error));
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function setupIpc() {
  ipcMain.handle("youdesign:check-for-updates", () => checkForUpdates(true));
  ipcMain.handle("youdesign:install-update", () => {
    if (!updateReadyToInstall) return false;
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (staticServer) staticServer.close();
});
