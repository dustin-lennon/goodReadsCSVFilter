import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { authorize } from '../auth';
import { OAuth2Client } from 'google-auth-library';
import { WeightedBook } from '../core/types';
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

  static async writeWeightedBooksToSheet(
    sheetId: string,
    weightedBooks: WeightedBook[],
    csvFilePath: string,
  ) {
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
   * - Handles Progressive series (e.g., "SAO: Progressive" must be read before "SAO")
   */
  static async createCuratedReadingSheet(
    sheetId: string,
    weightedBooks: WeightedBook[],
    csvFilePath: string,
  ) {
    const sheets = await this.getSheetsClient();

    // Get active series information
    const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);

    // Filter books for curated reading sheet
    const curatedBooksPromises = weightedBooks.map(async (wb) => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);

      // Include all non-series books (standalone books)
      if (!seriesInfo.seriesName) {
        return { include: true, book: wb };
      }

      // For book #1, check if there's a Progressive variant that should be read first
      if (seriesInfo.bookNumber === 1) {
        // Get all books to check for Progressive variants
        const allBooks = await import('./GoodreadsCSVService').then((m) =>
          m.GoodreadsCSVService.getAllBooks(csvFilePath),
        );

        // Check if there's a Progressive series for this base series
        const progressiveBooks = allBooks.filter((b) => {
          const info = SeriesDetector.extractSeriesInfo(b.Title);
          if (!info.seriesName) return false;

          // Check if this book is from a Progressive series
          const progressiveInfo = SeriesDetector.detectProgressiveSeries(info.seriesName);
          if (!progressiveInfo.isProgressive) return false;

          // The base series might have suffixes like "Light Novel", so we need to check
          // if the Progressive base matches the current series (with or without suffix)
          const currentSeriesBase = seriesInfo.seriesName?.toLowerCase() || '';
          const progressiveBase = progressiveInfo.baseSeries?.toLowerCase() || '';

          // Check if they match exactly, or if one is a prefix of the other
          const matches =
            currentSeriesBase === progressiveBase ||
            currentSeriesBase.startsWith(progressiveBase + ' ') ||
            progressiveBase.startsWith(currentSeriesBase + ' ');

          return (
            matches &&
            SeriesDetector.normalizeAuthor(b.Author) ===
              SeriesDetector.normalizeAuthor(wb.book.Author)
          );
        });

        // If Progressive series exists and has unread books, exclude this base series #1
        if (progressiveBooks.length > 0) {
          const toReadProgressiveBooks = progressiveBooks.filter(
            (b) => b['Exclusive Shelf'] === 'to-read',
          );
          if (toReadProgressiveBooks.length > 0) {
            return { include: false, book: wb };
          }
        }

        // No Progressive series or it's complete, include this book #1
        return { include: true, book: wb };
      }

      // Include if it's the next book in an active series
      if (
        seriesInfo.bookNumber &&
        ActiveSeriesService.isNextInActiveSeries(wb.book, activeSeries)
      ) {
        return { include: true, book: wb };
      }

      // Exclude other series books (not first, not next in active series)
      return { include: false, book: wb };
    });

    const curatedBooksResults = await Promise.all(curatedBooksPromises);
    const curatedBooks = curatedBooksResults
      .filter((result) => result.include)
      .map((result) => result.book);

    // Check if Curated Reading sheet exists, create if not
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const curatedSheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === 'Curated Reading',
      );

      if (!curatedSheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Curated Reading',
                  },
                },
              },
            ],
          },
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

      return [
        titleByAuthor,
        seriesInfo.seriesName || '',
        seriesInfo.bookNumber || '',
        bookType,
        wb.weight,
        wb.reason,
      ];
    });

    // Write to Curated Reading sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Curated Reading!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Book Title by Author', 'Series Name', 'Book Number', 'Type', 'Weight', 'Reason'],
          ...curatedValues,
        ],
      },
    });

    console.log(`📚 Created Curated Reading sheet with ${curatedBooks.length} books:`);

    // Log breakdown
    const standaloneBooks = curatedBooks.filter((wb) => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return !seriesInfo.seriesName;
    });

    const firstBooks = curatedBooks.filter((wb) => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return seriesInfo.bookNumber === 1;
    });

    const nextBooks = curatedBooks.filter((wb) => {
      const seriesInfo = SeriesDetector.extractSeriesInfo(wb.book.Title);
      return (
        seriesInfo.seriesName &&
        seriesInfo.bookNumber !== 1 &&
        ActiveSeriesService.isNextInActiveSeries(wb.book, activeSeries)
      );
    });

    console.log(`   📖 Standalone books: ${standaloneBooks.length}`);
    console.log(`   📚 First books in series: ${firstBooks.length}`);
    console.log(`   ➡️  Next books in active series: ${nextBooks.length}`);
  }
}
