const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileflyDesktop', {
  isDesktop: true,
  platform: process.platform,
  
  // File dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // OS Integrations
  openFile: (filePath) => ipcRenderer.invoke('shell:openFile', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:showInFolder', filePath),
  openDownloadsFolder: (dir) => ipcRenderer.invoke('shell:openDownloads', dir),
  showNotification: (title, body) => ipcRenderer.send('notify', { title, body }),
});
