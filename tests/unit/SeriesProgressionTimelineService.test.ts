import { SeriesProgressionTimelineService } from '../../src/services/SeriesProgressionTimelineService';
import { GoodreadsCSVService } from '../../src/services/GoodreadsCSVService';
import { Book } from '../../src/core/types';
import { BookProgressStatus } from '../../src/core/types';

// Mock the GoodreadsCSVService
jest.mock('../../src/services/GoodreadsCSVService');

describe('SeriesProgressionTimelineService', () => {
  const mockReadAllBooks = GoodreadsCSVService.readAllBooks as jest.MockedFunction<
    typeof GoodreadsCSVService.readAllBooks
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTimeline', () => {
    it('should generate timeline with books read in chronological order', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Cross Fire (Alex Cross, #17)',
          Author: 'James Patterson',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/15',
        },
        {
          Title: 'Triple Cross (Alex Cross, #22)',
          Author: 'James Patterson',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/06/20',
        },
        {
          Title: 'Alex Cross Must Die (Alex Cross, #32)',
          Author: 'James Patterson',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      expect(result.series).toHaveLength(1);
      const alexCrossSeries = result.series[0];
      expect(alexCrossSeries.seriesName).toBe('Alex Cross');
      expect(alexCrossSeries.author).toBe('James Patterson');
      expect(alexCrossSeries.booksRead).toBe(2);
      expect(alexCrossSeries.booksToRead).toBe(1);
      expect(alexCrossSeries.completionPercentage).toBeGreaterThan(0);

      // Check books are sorted by book number
      expect(alexCrossSeries.books[0].bookNumber).toBe(17);
      expect(alexCrossSeries.books[1].bookNumber).toBe(22);
      expect(alexCrossSeries.books[2].bookNumber).toBe(32);
    });

    it('should track currently-reading books correctly', async () => {
      const mockBooks: Book[] = [
        {
          Title: "Witch's Dawn (Unholy Trinity, #1)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
        {
          Title: "Witch's Twilight (Unholy Trinity, #2)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      expect(result.series).toHaveLength(1);
      const series = result.series[0];
      expect(series.booksInProgress).toBe(1);
      expect(series.booksToRead).toBe(1);

      const book1 = series.books.find((b) => b.bookNumber === 1);
      expect(book1?.status).toBe(BookProgressStatus.CURRENTLY_READING);

      const book2 = series.books.find((b) => b.bookNumber === 2);
      expect(book2?.status).toBe(BookProgressStatus.TO_READ);
    });

    it('should calculate completion percentage correctly', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Test Series, #1)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/01',
        },
        {
          Title: 'Book 2 (Test Series, #2)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/02/01',
        },
        {
          Title: 'Book 3 (Test Series, #3)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const series = result.series[0];
      // 2 out of 3 books read = ~66.67%
      expect(series.completionPercentage).toBeCloseTo(66.67, 1);
      expect(series.booksRead).toBe(2);
      expect(series.highestBookNumber).toBe(3);
    });

    it('should track first and last read dates', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Test Series, #1)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/15',
        },
        {
          Title: 'Book 2 (Test Series, #2)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/06/20',
        },
        {
          Title: 'Book 3 (Test Series, #3)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const series = result.series[0];
      expect(series.firstReadDate).toBeDefined();
      expect(series.lastReadDate).toBeDefined();
      expect(series.firstReadDate?.getTime()).toBeLessThan(series.lastReadDate!.getTime());
    });

    it('should handle multiple series', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Series A, #1)',
          Author: 'Author A',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/01',
        },
        {
          Title: 'Book 2 (Series A, #2)',
          Author: 'Author A',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'Book 1 (Series B, #1)',
          Author: 'Author B',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/02/01',
        },
        {
          Title: 'Book 2 (Series B, #2)',
          Author: 'Author B',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      expect(result.series).toHaveLength(2);
      expect(result.totalSeries).toBe(2);
    });

    it('should handle books without series information', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Standalone Book',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/01',
        },
        {
          Title: 'Book 1 (Test Series, #1)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/02/01',
        },
        {
          Title: 'Book 2 (Test Series, #2)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      // Should only include series books
      expect(result.series).toHaveLength(1);
      expect(result.series[0].seriesName).toBe('Test Series');
    });

    it('should handle reading-next shelf status', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Test Series, #1)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/01',
        },
        {
          Title: 'Book 2 (Test Series, #2)',
          Author: 'Test Author',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const series = result.series[0];
      const book2 = series.books.find((b) => b.bookNumber === 2);
      expect(book2?.status).toBe(BookProgressStatus.READING_NEXT);
    });

    it('should update currentBookNumber from active series', async () => {
      const mockBooks: Book[] = [
        {
          Title: "Witch's Dawn (Unholy Trinity, #1)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
        {
          Title: "Witch's Twilight (Unholy Trinity, #2)",
          Author: 'Crystal Ash',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const series = result.series[0];
      expect(series.currentBookNumber).toBe(1);
    });

    it('should calculate totals across all series', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Series A, #1)',
          Author: 'Author A',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2023/01/01',
        },
        {
          Title: 'Book 2 (Series A, #2)',
          Author: 'Author A',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'Book 1 (Series B, #1)',
          Author: 'Author B',
          Bookshelves: '',
          'Exclusive Shelf': 'currently-reading',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      expect(result.totalBooksRead).toBe(1);
      expect(result.totalBooksInProgress).toBe(1);
    });

    it('should calculate completion percentage correctly with non-sequential book numbers', async () => {
      const mockBooks: Book[] = [
        {
          Title: 'Book 0.1 (Divergent, #0.1)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/12/01',
        },
        {
          Title: 'Book 0.2 (Divergent, #0.2)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
        },
        {
          Title: 'Book 0.3 (Divergent, #0.3)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/12/02',
        },
        {
          Title: 'Book 0.4 (Divergent, #0.4)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/12/02',
        },
        {
          Title: 'Book 1 (Divergent, #1)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/12/05',
        },
        {
          Title: 'Book 1.5 (Divergent, #1.5)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/12/06',
        },
        {
          Title: 'Book 2 (Divergent, #2)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
        {
          Title: 'Book 2.5 (Divergent, #2.5)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
        {
          Title: 'Book 3 (Divergent, #3)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
        {
          Title: 'Book 3.5 (Divergent, #3.5)',
          Author: 'Veronica Roth',
          Bookshelves: '',
          'Exclusive Shelf': 'reading-next',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const series = result.series[0];
      // 6 books read out of 10 total books tracked = 60%
      expect(series.booksRead).toBe(6);
      expect(series.books.length).toBe(10);
      expect(series.completionPercentage).toBeCloseTo(60.0, 1);
      // Ensure completion percentage never exceeds 100%
      expect(series.completionPercentage).toBeLessThanOrEqual(100);
    });
  });
});
