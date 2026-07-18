import { app, BrowserWindow, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAdapterManager } from './adapter-manager.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 1000, minHeight: 680,
    titleBarStyle: 'hiddenInset', backgroundColor: '#09090b',
    icon: path.join(__dirname, '../../public/logo.png'),
    webPreferences: { preload: path.join(__dirname, '../preload/preload.cjs') },
  });
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '../../dist/index.html'));
}

app.whenReady().then(() => {
  registerAdapterManager();
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, '../../public/logo.png');
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
