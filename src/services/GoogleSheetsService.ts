import path from 'path';
import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { authorize } from '../auth';
import { OAuth2Client } from 'google-auth-library';
import { WeightedBook } from '../core/types';

// Helper function to get resource paths that work in both development and packaged app
function getResourcePath(filename: string): string {
  // Check if we're in a packaged Electron app
  const isPackaged = process.mainModule?.filename.indexOf('app.asar') !== -1;

  // In development, use current working directory
  if (process.env.NODE_ENV === 'development' || !isPackaged) {
    return path.join(process.cwd(), filename);
  }

  // In packaged app, try to get the app's resource directory
  try {
    const { app } = require('electron');
    if (app && app.getPath) {
      // Electron packaged app - look in userData directory first, then resources
      const userDataPath = path.join(app.getPath('userData'), filename);
      const resourcePath = path.join(process.resourcesPath || '', filename);

      // Try userData first (for user-created files like sheet-id.txt)
      const fs = require('fs');
      if (fs.existsSync(userDataPath)) {
        return userDataPath;
      }
      // Fall back to resources (for app-bundled files)
      if (fs.existsSync(resourcePath)) {
        return resourcePath;
      }
      // If neither exists, return userData path for creation
      return userDataPath;
    }
  } catch {
    // If electron is not available, fall back
    console.log('Electron not available, using fallback path');
  }

  // Fallback to process.cwd()
  return path.join(process.cwd(), filename);
}

const SHEET_ID_FILE = getResourcePath('sheet-id.txt');

/**
 * Service for Google Sheets integration
 */
export class GoogleSheetsService {
  static async getSheetsClient() {
    const authClient = (await authorize()) as OAuth2Client;
    return google.sheets({ version: 'v4', auth: authClient });
  }

  static async getOrCreateSheet(): Promise<string> {
    try {
      const existingId = await readFile(SHEET_ID_FILE, 'utf-8');
      const trimmed = existingId.trim();

      if (trimmed) {
        console.log(`✅ Using existing sheet ID: ${trimmed}`);
        return trimmed;
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.log(`📂 Sheet ID file not found. Will create a new sheet.`);
      } else if (error instanceof Error) {
        console.error(`❌ Error reading ${SHEET_ID_FILE}:`, error.message);
      } else {
        console.error(`❌ Error reading ${SHEET_ID_FILE}:`, error);
      }
    }

    // Create a new sheet
    const sheets = await this.getSheetsClient();
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'GoodReads Books',
        },
      },
    });

    const sheetId = response.data.spreadsheetId!;
    await writeFile(SHEET_ID_FILE, sheetId);
    console.log(`✅ Created new sheet: ${sheetId}`);

    return sheetId;
  }

  static async writeWeightedBooksToSheet(sheetId: string, weightedBooks: WeightedBook[]) {
    const sheets = await this.getSheetsClient();

    // Clear existing data from Sheet1
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: 'Sheet1',
    });

    const values = weightedBooks.map((wb) => {
      const titleByAuthor = `${wb.book.Title} by ${wb.book.Author}`;
      return [titleByAuthor, wb.book.Bookshelves, wb.weight, wb.reason];
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Book Title by Author', 'Bookshelves', 'Weight', 'Reason'], ...values],
      },
    });

    console.log(
      `📤 Wrote ${weightedBooks.length} books to Google Sheet with intelligent weighting.`,
    );

    // Log weight distribution
    const weightCounts = weightedBooks.reduce(
      (acc, wb) => {
        acc[wb.weight] = (acc[wb.weight] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    console.log('📊 Weight distribution:');
    Object.entries(weightCounts)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([weight, count]) => {
        console.log(`   ${weight}x weight: ${count} books`);
      });
  }
}
