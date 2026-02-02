import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { authorize } from '../auth';
import { OAuth2Client } from 'google-auth-library';
import { WeightedBook, Book } from '../core/types';
import { getResourcePath } from '../utils/pathResolver';
import { SeriesDetector } from '../core/SeriesDetector';
import { ActiveSeriesService } from './ActiveSeriesService';

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

  static async writeWeightedBooksToSheet(sheetId: string, weightedBooks: WeightedBook[], csvFilePath: string) {
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

    // Create and populate the Curated Reading sheet
    await this.createCuratedReadingSheet(sheetId, weightedBooks, csvFilePath);

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

  /**
   * Create and populate a Curated Reading sheet with:
   * - First books in any series (book #1)
   * - Next books in active series (continuation books)
   * - All non-series books (standalone books)
   */
  static async createCuratedReadingSheet(sheetId: string, weightedBooks: WeightedBook[], csvFilePath: string) {
    const sheets = await this.getSheetsClient();

    // Get active series information
    const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);

    // Filter books for curated reading sheet
    const curatedBooks = weightedBooks.filter((wb) => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      
      // Include all non-series books (standalone books)
      if (!seriesInfo.seriesName) {
        return true;
      }

      // Include if it's book #1 of any series
      if (seriesInfo.bookNumber === 1) {
        return true;
      }

      // Include if it's the next book in an active series
      if (seriesInfo.bookNumber && ActiveSeriesService.isNextInActiveSeries(wb.book, activeSeries)) {
        return true;
      }

      // Exclude other series books (not first, not next in active series)
      return false;
    });

    // Check if Curated Reading sheet exists, create if not
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const curatedSheetExists = spreadsheet.data.sheets?.some(
        sheet => sheet.properties?.title === 'Curated Reading'
      );

      if (!curatedSheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Curated Reading',
                }
              }
            }]
          }
        });
        console.log('📋 Created Curated Reading sheet');
      }
    } catch (error) {
      console.error('Error checking/creating Curated Reading sheet:', error);
      return;
    }

    // Clear existing data from Curated Reading sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: 'Curated Reading',
    });

    // Prepare data for Curated Reading sheet
    const curatedValues = curatedBooks.map((wb) => {
      const titleByAuthor = `${wb.book.Title} by ${wb.book.Author}`;
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      
      let bookType = 'Standalone';
      if (seriesInfo.seriesName) {
        if (seriesInfo.bookNumber === 1) {
          bookType = 'First Book';
        } else if (ActiveSeriesService.isNextInActiveSeries(wb.book, activeSeries)) {
          bookType = 'Next in Series';
        }
      }
      
      return [titleByAuthor, seriesInfo.seriesName || '', seriesInfo.bookNumber || '', bookType, wb.weight, wb.reason];
    });

    // Write to Curated Reading sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Curated Reading!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Book Title by Author', 'Series Name', 'Book Number', 'Type', 'Weight', 'Reason'], 
          ...curatedValues
        ],
      },
    });

    console.log(`📚 Created Curated Reading sheet with ${curatedBooks.length} books:`);
    
    // Log breakdown
    const standaloneBooks = curatedBooks.filter(wb => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return !seriesInfo.seriesName;
    });
    
    const firstBooks = curatedBooks.filter(wb => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return seriesInfo.bookNumber === 1;
    });
    
    const nextBooks = curatedBooks.filter(wb => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return seriesInfo.seriesName && seriesInfo.bookNumber !== 1 && ActiveSeriesService.isNextInActiveSeries(wb.book, activeSeries);
    });

    console.log(`   📖 Standalone books: ${standaloneBooks.length}`);
    console.log(`   📚 First books in series: ${firstBooks.length}`);
    console.log(`   ➡️  Next books in active series: ${nextBooks.length}`);
  }
}
