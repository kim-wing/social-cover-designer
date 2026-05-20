const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("youdesignDesktop", {
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
  onCheckUpdate(callback) {
    ipcRenderer.on("youdesign:check-update", callback);
  },
  checkForUpdates() {
    return ipcRenderer.invoke("youdesign:check-for-updates");
  },
  installUpdate() {
    return ipcRenderer.invoke("youdesign:install-update");
  },
  onUpdateStatus(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("youdesign:update-status", listener);
    return () => ipcRenderer.removeListener("youdesign:update-status", listener);
  }
});
