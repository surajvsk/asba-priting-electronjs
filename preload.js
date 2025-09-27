const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  overlayPDF: (data) => ipcRenderer.send('overlay-pdf', data),
  onPDFOverlayDone: (callback) => ipcRenderer.on('pdf-overlay-done', (event, result) => callback(result)),
  getAllKeys: () => ipcRenderer.invoke('get-all-keys'),
  getAllKeysWithValues: () => ipcRenderer.invoke('get-all-keys-with-values'),
  getItem: (key) => ipcRenderer.invoke('storage-get', key),
  removeItem: (key) => ipcRenderer.invoke('storage-remove', key),
  clearAll: () => ipcRenderer.invoke('storage-clear')
});