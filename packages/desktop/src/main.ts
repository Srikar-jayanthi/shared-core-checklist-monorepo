import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { ChecklistStore } from '@checklist/core';
import { FileStorageAdapter } from './storage/FileStorageAdapter';

let mainWindow: BrowserWindow | null = null;
const storageAdapter = new FileStorageAdapter();
const store = new ChecklistStore(storageAdapter);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 500,
    minHeight: 500,
    title: 'Checklist Desktop Shell',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const indexPath = path.join(__dirname, '../src/index.html');
  mainWindow.loadFile(indexPath).catch(() => {
    // If running from built dist
    mainWindow?.loadFile(path.join(__dirname, 'index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers hooking desktop renderer to shared core store
ipcMain.handle('store:getTasks', () => store.getFilteredTasks());
ipcMain.handle('store:addTask', async (_, title: string) => store.addTask(title));
ipcMain.handle('store:toggleTask', async (_, id: string) => store.toggleTask(id));
ipcMain.handle('store:deleteTask', async (_, id: string) => store.deleteTask(id));
ipcMain.handle('store:setFilter', (_, filter) => store.setFilter(filter));
ipcMain.handle('store:getFilter', () => store.getFilter());

store.subscribe(() => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('store:changed', {
      tasks: store.getFilteredTasks(),
      filter: store.getFilter(),
    });
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
