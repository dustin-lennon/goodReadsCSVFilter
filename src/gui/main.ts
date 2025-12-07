import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { BookWeightingApp } from '../core/BookWeightingApp';
import { SeriesProgressionTimelineService } from '../services/SeriesProgressionTimelineService';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    app.whenReady().then(() => this.createWindow());

    // Handle app lifecycle events
    app.on('window-all-closed', () => {
      // Quit the app when all windows are closed on all platforms
      app.quit();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
    });

    // Handle app quit event
    app.on('before-quit', () => {
      // Clean up any running processes
      console.log('Application is quitting...');
    });

    // Set up IPC handlers
    this.setupIpcHandlers();
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: 'GoodReads Book Weighting System',
      show: false, // Don't show until ready
    });

    // Load the HTML file
    this.mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window close event
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window close request
    this.mainWindow.on('close', () => {
      // Allow the window to close normally
      // Note: You could add a confirmation dialog here if processing is running
      // For now, we'll allow immediate close for better UX
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  private setupIpcHandlers(): void {
    // Handle file selection
    ipcMain.handle('select-csv-file', async () => {
      if (!this.mainWindow) return null;

      const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
        title: 'Select GoodReads CSV File',
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (canceled || filePaths.length === 0) {
        return null;
      }

      return filePaths[0];
    });

    // Handle book weighting process
    ipcMain.handle('process-books', async (_event, csvFilePath: string) => {
      try {
        // Create a progress callback that sends updates to the renderer
        const progressCallback = (message: string) => {
          this.mainWindow?.webContents.send('progress-update', message);
        };

        // Run the book weighting process
        const result = await BookWeightingApp.runWithProgress(csvFilePath, progressCallback);

        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    });

    // Handle opening Google Sheets URL
    ipcMain.handle('open-sheets-url', async (_event, url: string) => {
      const { shell } = require('electron');
      await shell.openExternal(url);
    });

    // Handle timeline generation
    ipcMain.handle('generate-timeline', async (_event, csvFilePath: string) => {
      try {
        const timeline = await SeriesProgressionTimelineService.generateTimeline(csvFilePath);
        return {
          success: true,
          timeline,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    });
  }
}

// Create the Electron app
new ElectronApp();
