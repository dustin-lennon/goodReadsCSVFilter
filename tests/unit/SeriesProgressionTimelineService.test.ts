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

    it('should show a series when the #1 book is read but a sub-#1 prequel is unread', async () => {
      // Colter Shaw: prequel novella #0.5 is the lowest-numbered book and still to-read,
      // but the main entry #1 has been read. The series must still appear.
      const mockBooks: Book[] = [
        {
          Title: 'Captivated (Colter Shaw, #0.5)',
          Author: 'Jeffery Deaver',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'The Never Game (Colter Shaw, #1)',
          Author: 'Jeffery Deaver',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/08/21',
        },
        {
          Title: 'The Goodbye Man (Colter Shaw, #2)',
          Author: 'Jeffery Deaver',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const colterShaw = result.series.find((s) => s.seriesName === 'Colter Shaw');
      expect(colterShaw).toBeDefined();
      expect(colterShaw?.booksRead).toBe(1);
    });

    it('should still hide series the reader jumped into mid-run', async () => {
      // Only book #5 read, #1 never started → not a real "start", must stay hidden.
      const mockBooks: Book[] = [
        {
          Title: 'Book 1 (Jumped Series, #1)',
          Author: 'Some Author',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'Book 5 (Jumped Series, #5)',
          Author: 'Some Author',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/01/01',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      expect(result.series.find((s) => s.seriesName === 'Jumped Series')).toBeUndefined();
    });

    it('should merge an alias series name into its canonical series', async () => {
      // GoodReads names one book "Jane Rizzoli & Maura Isles" while the rest are
      // "Rizzoli & Isles". Freaks (#8.5) must fold into the main series, not vanish.
      const mockBooks: Book[] = [
        {
          Title: 'The Surgeon (Rizzoli & Isles, #1)',
          Author: 'Tess Gerritsen',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/06/01',
        },
        {
          Title: 'Ice Cold (Rizzoli & Isles, #8)',
          Author: 'Tess Gerritsen',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2026/02/01',
        },
        {
          Title: 'Freaks (Jane Rizzoli & Maura Isles, #8.5)',
          Author: 'Tess Gerritsen',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2026/07/03',
        },
        {
          Title: 'The Silent Girl (Rizzoli & Isles, #9)',
          Author: 'Tess Gerritsen',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      // Only one Rizzoli series, and it contains the #8.5 alias book
      const rizzoli = result.series.filter((s) => s.seriesName.toLowerCase().includes('rizzoli'));
      expect(rizzoli).toHaveLength(1);
      expect(rizzoli[0].seriesName).toBe('Rizzoli & Isles');
      expect(rizzoli[0].books.some((b) => b.bookNumber === 8.5)).toBe(true);
      expect(rizzoli[0].books.some((b) => b.title.includes('Freaks'))).toBe(true);
    });

    it('should NOT merge same-author sub-series that share only one significant token', async () => {
      // "Mistborn" vs "Mistborn: Wax & Wayne" share only the token "mistborn".
      // The 2-token guard must keep them as distinct series.
      const mockBooks: Book[] = [
        {
          Title: 'The Final Empire (Mistborn, #1)',
          Author: 'Brandon Sanderson',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/01/01',
        },
        {
          Title: 'The Well of Ascension (Mistborn, #2)',
          Author: 'Brandon Sanderson',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
        {
          Title: 'The Alloy of Law (Mistborn: Wax & Wayne, #1)',
          Author: 'Brandon Sanderson',
          Bookshelves: '',
          'Exclusive Shelf': 'read',
          'Date Read': '2025/03/01',
        },
        {
          Title: 'Shadows of Self (Mistborn: Wax & Wayne, #2)',
          Author: 'Brandon Sanderson',
          Bookshelves: '',
          'Exclusive Shelf': 'to-read',
        },
      ];

      mockReadAllBooks.mockResolvedValue(mockBooks);

      const result = await SeriesProgressionTimelineService.generateTimeline('fake-path.csv');

      const mistbornSeries = result.series.filter((s) =>
        s.seriesName.toLowerCase().includes('mistborn'),
      );
      expect(mistbornSeries).toHaveLength(2);
    });
  });
});
