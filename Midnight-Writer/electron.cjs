const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // Removes the default white menu bar for better immersion
    autoHideMenuBar: true, 
    // Dark background to match app
    backgroundColor: '#000000', 
  });

  // Decide what to load
  const isDev = process.env.IS_DEV === "true";

  if (isDev) {
    // In dev mode, load the Vite local server
    win.loadURL('http://localhost:5173');
    // Open DevTools automatically if you want
    // win.webContents.openDevTools();
  } else {
    // In production, load the built index.html file
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// App Ready Event
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
