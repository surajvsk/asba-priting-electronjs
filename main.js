const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
// Database file path
const path = require('node:path')
const { PDFDocument, rgb } = require('pdf-lib'); // Using pdf-lib for PDF overlay
const createWindow = () => {
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
}



ipcMain.on('overlay-pdf', async (event, data) => {
  console.log('Received data for PDF overlay:', data);

  try {
    // Load the existing PDF file
    const pdfPath = path.join(__dirname, 'ASBA.pdf');
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Create a new PDF that contains only the first page
    const newPdfDoc = await PDFDocument.create();
    const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(firstPage);

data.coordinates.forEach((item) => {
  let textValue = item.value || item.key || ''; // fallback if empty

  // ✅ Apply splitter effect using letterSpacing
  const spacing = Number(item.letterSpacing) || 0;

  // Create a spaced string by adding extra spaces
  if (spacing > 0) {
    const spaceCount = Math.max(1, Math.round(spacing / 2)); // adjust factor to tune spacing
    const spaceStr = ' '.repeat(spaceCount);
    textValue = textValue.split('').join(spaceStr);
  }

  firstPage.drawText(textValue, {
    x: Number(item.x),
    y: Number(item.y),
    size: Number(item.fontSize) || 10,
    color: rgb(0, 0, 0),
    // optional: small extra characterSpacing for fine tuning
    characterSpacing: 0,
  });
});

    // ✅ Save PDF in same folder as your Electron app
    const savePath = path.join(__dirname, 'overlayed.pdf');
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(savePath, pdfBytes);

    dialog.showMessageBox({
      type: 'info',
      message: `✅ PDF saved successfully as overlayed.pdf`,
      detail: `File path: ${savePath}`,
    });

    console.log(`PDF saved successfully at: ${savePath}`);
  } catch (err) {
    console.error('Error overlaying PDF:', err);
    dialog.showErrorBox('PDF Overlay Error', err.message);
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