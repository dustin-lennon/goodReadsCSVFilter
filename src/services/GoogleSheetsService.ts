import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { authorize } from '../auth';
import { OAuth2Client } from 'google-auth-library';
import { WeightedBook } from '../core/types';
import { getResourcePath } from '../utils/pathResolver';

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
