const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  overlayPDF: (data) => ipcRenderer.send('overlay-pdf', data),
  onPDFOverlayDone: (callback) => ipcRenderer.on('pdf-overlay-done', (event, result) => callback(result))
});