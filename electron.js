const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Dunkly",
    show: false, // 👈 1. NE PAS AFFICHER LA FENÊTRE AU DÉMARRAGE
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
    },
  });

  win.setMenu(null);
  win.loadURL('https://dunkly-app.vercel.app'); 

  // 👈 2. AFFICHER LA FENÊTRE QUAND LE SITE EST PRÊT
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});