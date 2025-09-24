const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib'); // Using pdf-lib for PDF overlay
const path = require('node:path')
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
    // Load existing PDF
    const existingPdfBytes = fs.readFileSync("ASBA.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Create a new PDF for just the first page
    const newPdfDoc = await PDFDocument.create();
    const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(firstPage);

    // Overlay each coordinate on the first page
    data.coordinates.forEach((item) => {

      firstPage.drawText(item.value, {
        x: item.x,
        y: item.y,
        size: item.fontSize,
        color: rgb(0, 0, 0), // Black text
         letterSpacing: Number(item.wordspaceCount) // add space between characters
      });
    });

    // Save new PDF
    const pdfBytes = await newPdfDoc.save();
    const savePath = path.join('/', 'overlayed.pdf');
    fs.writeFileSync(savePath, pdfBytes);

    dialog.showMessageBox({ message: `PDF saved as overlayed.pdf` });
  } catch (err) {
    console.error(err);
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