import { GoodreadsCSVService } from '../../src/services/GoodreadsCSVService';
import { BookWeightingService } from '../../src/services/BookWeightingService';
import { Book, WeightedBook } from '../../src/core/types';

// Mock the services
jest.mock('../../src/services/GoodreadsCSVService');
jest.mock('../../src/services/BookWeightingService');

// Mock the problematic external dependencies
jest.mock('../../src/services/GoogleSheetsService', () => ({
  GoogleSheetsService: {
    getOrCreateSheet: jest.fn().mockResolvedValue('mock-sheet-id'),
    writeWeightedBooksToSheet: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/gui/launchFileDialog', () => ({
  selectCSVFile: jest.fn().mockReturnValue('/mock/path/to/file.csv'),
}));

// Import the mocked modules
const { GoogleSheetsService } = require('../../src/services/GoogleSheetsService');
const { selectCSVFile } = require('../../src/gui/launchFileDialog');

// Mock console methods to avoid noise in test output
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('BookWeightingApp', () => {
  const mockGetToReadBooks = GoodreadsCSVService.getToReadBooks as jest.MockedFunction<
    typeof GoodreadsCSVService.getToReadBooks
  >;
  const mockApplyWeights = BookWeightingService.applyWeights as jest.MockedFunction<
    typeof BookWeightingService.applyWeights
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('run', () => {
    it('should complete the full workflow successfully', async () => {
      // Dynamic import to avoid module loading issues
      const { BookWeightingApp } = await import('../../src/core/BookWeightingApp');

      // Setup mocks
      const mockBooks: Book[] = [
        {
          Title: "Witch's Twilight (Unholy Trinity, #2)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'Random Book',
          Author: 'Random Author',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      const mockWeightedBooks: WeightedBook[] = [
        {
          book: mockBooks[0],
          weight: 5,
          reason: 'Next book in Unholy Trinity series (currently on book 1)',
        },
        {
          book: mockBooks[1],
          weight: 1,
          reason: 'Standard weight',
        },
      ];

      selectCSVFile.mockReturnValue('/fake/path/to/file.csv');
      mockGetToReadBooks.mockResolvedValue(mockBooks);
      mockApplyWeights.mockResolvedValue(mockWeightedBooks);
      GoogleSheetsService.getOrCreateSheet.mockResolvedValue('fake-sheet-id');
      GoogleSheetsService.writeWeightedBooksToSheet.mockResolvedValue();

      // Run the app
      await BookWeightingApp.run();

      // Verify the workflow
      expect(selectCSVFile).toHaveBeenCalled();
      expect(mockGetToReadBooks).toHaveBeenCalledWith(expect.stringContaining('file.csv'));
      expect(mockApplyWeights).toHaveBeenCalledWith(mockBooks, expect.stringContaining('file.csv'));
      expect(GoogleSheetsService.getOrCreateSheet).toHaveBeenCalled();
      expect(GoogleSheetsService.writeWeightedBooksToSheet).toHaveBeenCalledWith(
        'fake-sheet-id',
        mockWeightedBooks,
      );

      // Verify console output includes key information
      expect(consoleSpy).toHaveBeenCalledWith('📚 GoodReads Book Weighting System');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 books on your to-read shelf'),
      );
    });

    it('should handle errors gracefully', async () => {
      const { BookWeightingApp } = await import('../../src/core/BookWeightingApp');

      const mockError = new Error('CSV file not found');
      selectCSVFile.mockReturnValue('/fake/path.csv');
      mockGetToReadBooks.mockRejectedValue(mockError);

      // Mock process.exit to prevent actual exit but allow execution to continue
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      // The function will throw after process.exit when exit is mocked
      await expect(BookWeightingApp.run()).rejects.toThrow('CSV file not found');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ An unexpected error occurred:',
        'CSV file not found',
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});
