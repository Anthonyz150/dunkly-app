const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Dunkly", // 👈 AJOUTE CETTE LIGNE
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
    },
  });

  win.setMenu(null);
  win.loadURL('https://dunkly-app.vercel.app'); 
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});