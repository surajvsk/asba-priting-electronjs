const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const storage = require('./src/storage/storageUtils'); // our common node-persist wrapper
const fs = require('fs');
// Database file path
const path = require('node:path')
const { PDFDocument, rgb } = require('pdf-lib'); // Using pdf-lib for PDF overlay

let appSettings = {
  inputPath: '',
  outputPath: ''
};

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'), // important
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  // Open DevTools automatically
  win.loadFile('index.html')
  win.webContents.openDevTools();
  // Initialize storage once
 const storagePath = path.join(app.getPath('userData'), 'storage');
  await storage.initStorage(storagePath); // safe folder for EXE
}






ipcMain.on('overlay-pdf', async (event, data) => {
  console.log('Received data for PDF overlay:', data);

  try {
    const redisKey = data.symbol; // your unique key
    const existing = await storage.getItem(redisKey);

    if (existing) {
      console.log(`Overlay data for key "${redisKey}" already exists. Skipping save.`);
      dialog.showMessageBox({
        type: 'info',
        message: `⚠️ Overlay data for key "${redisKey}" already exists. Skipping save.`,
      });
      return; // <-- stop further execution
    }

    // Load the existing PDF file
    const pdfPath = path.join(__dirname, 'ASBA.pdf');
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Create a new PDF with the first page
    const newPdfDoc = await PDFDocument.create();
    const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(firstPage);

    // Draw all fields
    data.coordinates.forEach((item) => {
      let textValue = item.value || item.key || '';
      const spacing = Number(item.letterSpacing) || 0;
      if (spacing > 0) {
        const spaceCount = Math.max(1, Math.round(spacing / 2));
        const spaceStr = ' '.repeat(spaceCount);
        textValue = textValue.split('').join(spaceStr);
      }

      firstPage.drawText(textValue, {
        x: Number(item.x),
        y: Number(item.y),
        size: Number(item.fontSize) || 10,
        color: rgb(0, 0, 0),
        characterSpacing: 0,
      });
    });

    // Save PDF
    const savePath = path.join(__dirname, 'overlayed.pdf');
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(savePath, pdfBytes);

    // Save overlay data in storage
    await storage.setItem(redisKey, data);
    console.log(`Saved new overlay data for key: ${redisKey}`);

    // Optional: log current keys
    const allKeys = await storage.getAllKeys();
    console.log('Current Storage Keys:', allKeys);

    // Notify user
    dialog.showMessageBox({
      type: 'info',
      message: `✅ PDF saved successfully as overlayed.pdf`,
      detail: `File path: ${savePath}`,
    });

  } catch (err) {
    console.error('Error overlaying PDF:', err);
    dialog.showErrorBox('PDF Overlay Error', err.message);
  }
});


// Fetch all stored keys
ipcMain.handle('get-all-keys', async () => {
  try {
    const keys = await storage.getAllKeys();
    return keys;
  } catch (err) {
    console.error('Error fetching keys:', err);
    return [];
  }
});

ipcMain.handle('storage-get', async (event, key) => {
  try {
    const value = await storage.getItem(key);
    return value;
  } catch (err) {
    console.error('Error fetching storage key:', key, err);
    return null;
  }
});


ipcMain.handle('storage-keys', async () => {
  return await storage.getAllKeys();
});

ipcMain.handle('storage-set', async (event, key, value) => {
  return await storage.setItem(key, value);
});

ipcMain.handle('storage-remove', async (event, key) => {
  return await storage.removeItem(key);
});

ipcMain.handle('storage-clear', async () => {
  return await storage.clearAll();
});


ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsWithDate = {
      ...settings,
      savedAt: new Date().toISOString()
    };

    // Save persistently
    await storage.setItem('appSettings', settingsWithDate);

    // Update in-memory copy
    appSettings = settingsWithDate;

    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    if (!appSettings) {
      appSettings = await storage.getItem('appSettings') || {};
    }
    return appSettings;
  } catch (err) {
    console.error('Error getting settings:', err);
    return {};
  }
});


app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 🧹 Stop Redis when app quits
app.on('before-quit', async () => {
  await stopRedis();
});