import { ActiveSeriesService } from '../../src/services/ActiveSeriesService';
import { GoodreadsCSVService } from '../../src/services/GoodreadsCSVService';
import { Book } from '../../src/core/types';

// Mock the GoodreadsCSVService
jest.mock('../../src/services/GoodreadsCSVService');

describe('ActiveSeriesService', () => {
  const mockGetCurrentlyReadingBooks =
    GoodreadsCSVService.getCurrentlyReadingBooks as jest.MockedFunction<
      typeof GoodreadsCSVService.getCurrentlyReadingBooks
    >;
  const mockGetReadingNextBooks = GoodreadsCSVService.getReadingNextBooks as jest.MockedFunction<
    typeof GoodreadsCSVService.getReadingNextBooks
  >;
  const mockGetReadBooks = GoodreadsCSVService.getReadBooks as jest.MockedFunction<
    typeof GoodreadsCSVService.getReadBooks
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default empty read books for tests that don't need them
    mockGetReadBooks.mockResolvedValue([]);
  });

  describe('detectActiveSeries', () => {
    it('should detect series from currently-reading and reading-next books', async () => {
      const currentlyReadingBooks: Book[] = [
        {
          Title: "Witch's Dawn (Unholy Trinity, #1)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
        {
          Title: 'Cross Fire (Alex Cross, #17)',
          Author: 'James Patterson',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
      ];

      const readingNextBooks: Book[] = [
        {
          Title: 'The Never Game (Colter Shaw, #1)',
          Author: 'Jeffery Deaver',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
      ];

      mockGetCurrentlyReadingBooks.mockResolvedValue(currentlyReadingBooks);
      mockGetReadingNextBooks.mockResolvedValue(readingNextBooks);

      const result = await ActiveSeriesService.detectActiveSeries('fake-path.csv');

      expect(result).toHaveLength(3);

      const unholyTrinity = result.find((s) => s.seriesName === 'Unholy Trinity');
      expect(unholyTrinity).toBeDefined();
      expect(unholyTrinity?.currentBookNumber).toBe(1);
      expect(unholyTrinity?.author).toBe('Crystal Ash');

      const colterShaw = result.find((s) => s.seriesName === 'Colter Shaw');
      expect(colterShaw).toBeDefined();
      expect(colterShaw?.currentBookNumber).toBe(1);

      const alexCross = result.find((s) => s.seriesName === 'Alex Cross');
      expect(alexCross).toBeDefined();
      expect(alexCross?.currentBookNumber).toBe(17);
    });

    it('should handle same series with multiple books in active shelves', async () => {
      const currentlyReadingBooks: Book[] = [
        {
          Title: "Witch's Dawn (Unholy Trinity, #1)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
      ];

      const readingNextBooks: Book[] = [
        {
          Title: "Witch's Twilight (Unholy Trinity, #2)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
      ];

      mockGetCurrentlyReadingBooks.mockResolvedValue(currentlyReadingBooks);
      mockGetReadingNextBooks.mockResolvedValue(readingNextBooks);

      const result = await ActiveSeriesService.detectActiveSeries('fake-path.csv');

      // Should detect the currently-reading book but not duplicate the reading-next book
      // since it belongs to the same series by the same author
      expect(result).toHaveLength(1);

      const unholyTrinity = result[0];
      expect(unholyTrinity.seriesName).toBe('Unholy Trinity');
      expect(unholyTrinity.author).toBe('Crystal Ash');
      expect(unholyTrinity.currentBookNumber).toBe(1); // Should track the currently-reading book
    });

    it('should ignore books without series information', async () => {
      const currentlyReadingBooks: Book[] = [
        {
          Title: 'Standalone Book',
          Author: 'Solo Author',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
      ];

      mockGetCurrentlyReadingBooks.mockResolvedValue(currentlyReadingBooks);
      mockGetReadingNextBooks.mockResolvedValue([]);

      const result = await ActiveSeriesService.detectActiveSeries('fake-path.csv');

      expect(result).toHaveLength(0);
    });

    it('should detect series from recently read books', async () => {
      const readBooks: Book[] = [
        {
          Title: "Witch's Dawn (Unholy Trinity, #1)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/08/17', // Recent read date
        },
        {
          Title: 'Roses Are Red (Alex Cross, #6)',
          Author: 'James Patterson',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/08/14', // Recent read date
        },
      ];

      mockGetCurrentlyReadingBooks.mockResolvedValue([]);
      mockGetReadingNextBooks.mockResolvedValue([]);
      mockGetReadBooks.mockResolvedValue(readBooks);

      const result = await ActiveSeriesService.detectActiveSeries('fake-path.csv');

      expect(result).toHaveLength(2);

      const unholyTrinity = result.find((s) => s.seriesName === 'Unholy Trinity');
      expect(unholyTrinity).toBeDefined();
      expect(unholyTrinity?.currentBookNumber).toBe(1);

      const alexCross = result.find((s) => s.seriesName === 'Alex Cross');
      expect(alexCross).toBeDefined();
      expect(alexCross?.currentBookNumber).toBe(6);
    });

    it('should ignore old read books', async () => {
      const readBooks: Book[] = [
        {
          Title: 'Old Book (Old Series, #1)',
          Author: 'Old Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2020/01/01', // Old read date
        },
      ];

      mockGetCurrentlyReadingBooks.mockResolvedValue([]);
      mockGetReadingNextBooks.mockResolvedValue([]);
      mockGetReadBooks.mockResolvedValue(readBooks);

      const result = await ActiveSeriesService.detectActiveSeries('fake-path.csv');

      expect(result).toHaveLength(0);
    });
  });

  describe('isNextInActiveSeries', () => {
    const activeSeries = [
      {
        seriesName: 'Unholy Trinity',
        author: 'Crystal Ash',
        currentBook: "Witch's Dawn (Unholy Trinity, #1)",
        currentBookNumber: 1,
        normalizedAuthor: 'crystal ash',
      },
      {
        seriesName: 'Alex Cross',
        author: 'James Patterson',
        currentBook: 'Cross Fire (Alex Cross, #17)',
        currentBookNumber: 17,
        normalizedAuthor: 'james patterson',
      },
    ];

    it('should identify next book in series', () => {
      const nextUnholyBook: Book = {
        Title: "Witch's Twilight (Unholy Trinity, #2)",
        Author: 'Crystal Ash',
        Bookshelves: '',
        'Exclusive Shelf': 'to-read',
      };

      const result = ActiveSeriesService.isNextInActiveSeries(nextUnholyBook, activeSeries);
      expect(result).toBe(true);
    });

    it('should identify next Alex Cross book', () => {
      const nextAlexCrossBook: Book = {
        Title: 'I, Alex Cross (Alex Cross, #18)',
        Author: 'James Patterson',
        Bookshelves: '',
        'Exclusive Shelf': 'to-read',
      };

      const result = ActiveSeriesService.isNextInActiveSeries(nextAlexCrossBook, activeSeries);
      expect(result).toBe(true);
    });

    it('should not identify wrong book number', () => {
      const wrongBook: Book = {
        Title: 'Some Other Book (Unholy Trinity, #5)',
        Author: 'Crystal Ash',
        Bookshelves: '',
        'Exclusive Shelf': 'to-read',
      };

      const result = ActiveSeriesService.isNextInActiveSeries(wrongBook, activeSeries);
      expect(result).toBe(false);
    });

    it('should not identify unrelated books', () => {
      const unrelatedBook: Book = {
        Title: 'Random Book Title',
        Author: 'Some Author',
        Bookshelves: '',
        'Exclusive Shelf': 'to-read',
      };

      const result = ActiveSeriesService.isNextInActiveSeries(unrelatedBook, activeSeries);
      expect(result).toBe(false);
    });

    it('should not identify books from series not in active list', () => {
      const bookFromUnknownSeries: Book = {
        Title: 'Unknown Series Book (Mystery Series, #2)',
        Author: 'Unknown Author',
        Bookshelves: '',
        'Exclusive Shelf': 'to-read',
      };

      const result = ActiveSeriesService.isNextInActiveSeries(bookFromUnknownSeries, activeSeries);
      expect(result).toBe(false);
    });
  });
});
