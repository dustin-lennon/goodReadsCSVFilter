import { Book, ActiveSeries } from '../core/types';
import { SeriesDetector } from '../core/SeriesDetector';
import { GoodreadsCSVService } from './GoodreadsCSVService';
import { SeriesProgressionTimelineService } from './SeriesProgressionTimelineService';
import { BookProgressStatus } from '../core/types';

/**
 * Service for detecting active series based on currently reading and reading-next books
 */
export class ActiveSeriesService {
  /**
   * Detect active series from currently-reading, reading-next, recently read books, and incomplete series
   */
  static async detectActiveSeries(csvFilePath: string): Promise<ActiveSeries[]> {
    const currentlyReading = await GoodreadsCSVService.getCurrentlyReadingBooks(csvFilePath);
    const readingNext = await GoodreadsCSVService.getReadingNextBooks(csvFilePath);
    const readBooks = await GoodreadsCSVService.getReadBooks(csvFilePath);

    const activeSeries: ActiveSeries[] = [];

    // Process currently-reading books
    for (const book of currentlyReading) {
      const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
      if (seriesInfo.seriesName && seriesInfo.bookNumber) {
        activeSeries.push({
          seriesName: seriesInfo.seriesName,
          author: book.Author,
          currentBook: book.Title,
          currentBookNumber: seriesInfo.bookNumber,
          normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author),
        });
      }
    }

    // Process recently read books (last 2 years to catch active series)
    const currentYear = new Date().getFullYear();
    const recentReadBooks = readBooks.filter((book) => {
      if (!book['Date Read']) return false;
      const readDate = new Date(book['Date Read']);
      const readYear = readDate.getFullYear();
      return currentYear - readYear <= 1; // Books read within last 2 years
    });

    for (const book of recentReadBooks) {
      const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
      if (seriesInfo.seriesName && seriesInfo.bookNumber) {
        // Check if this series is already tracked
        const existing = activeSeries.find(
          (s) =>
            s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
            s.normalizedAuthor === SeriesDetector.normalizeAuthor(book.Author),
        );

        if (!existing) {
          activeSeries.push({
            seriesName: seriesInfo.seriesName,
            author: book.Author,
            currentBook: book.Title,
            currentBookNumber: seriesInfo.bookNumber,
            normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author),
          });
        } else {
          // Update to the highest book number if this is more recent
          if (seriesInfo.bookNumber > existing.currentBookNumber) {
            existing.currentBook = book.Title;
            existing.currentBookNumber = seriesInfo.bookNumber;
          }
        }
      }
    }

    // Process reading-next books
    for (const book of readingNext) {
      const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
      if (seriesInfo.seriesName && seriesInfo.bookNumber) {
        // Check if this series is already tracked
        const existing = activeSeries.find(
          (s) =>
            s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
            s.normalizedAuthor === SeriesDetector.normalizeAuthor(book.Author),
        );

        if (!existing) {
          activeSeries.push({
            seriesName: seriesInfo.seriesName,
            author: book.Author,
            currentBook: book.Title,
            currentBookNumber: seriesInfo.bookNumber,
            normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author),
          });
        }
      }
    }

    // Also detect active series from incomplete series (have some books read, some to-read)
    // This catches series like Rizzoli & Isles where you've read books 1-7 and have 8-13 to read
    const timeline = await SeriesProgressionTimelineService.generateTimeline(csvFilePath);

    for (const series of timeline.series) {
      // Only consider incomplete series (have books to read)
      if (series.booksToRead > 0 || series.booksInProgress > 0) {
        // Check if this series is already tracked
        const existing = activeSeries.find(
          (s) =>
            s.seriesName.toLowerCase() === series.seriesName.toLowerCase() &&
            s.normalizedAuthor === series.normalizedAuthor,
        );

        if (!existing) {
          // Find the highest book number that has been read
          const readBooks = series.books
            .filter((b) => b.status === BookProgressStatus.READ)
            .sort((a, b) => b.bookNumber - a.bookNumber);

          if (readBooks.length > 0) {
            const highestReadBook = readBooks[0];
            activeSeries.push({
              seriesName: series.seriesName,
              author: series.author,
              currentBook: highestReadBook.title,
              currentBookNumber: highestReadBook.bookNumber,
              normalizedAuthor: series.normalizedAuthor,
            });
          } else if (series.currentBookNumber) {
            // Use current book number if available (currently-reading or reading-next)
            const currentBook = series.books.find(
              (b) =>
                b.status === BookProgressStatus.CURRENTLY_READING ||
                b.status === BookProgressStatus.READING_NEXT,
            );
            if (currentBook) {
              activeSeries.push({
                seriesName: series.seriesName,
                author: series.author,
                currentBook: currentBook.title,
                currentBookNumber: currentBook.bookNumber,
                normalizedAuthor: series.normalizedAuthor,
              });
            }
          }
        } else {
          // Update to the highest book number if this series has a higher one
          const readBooks = series.books
            .filter((b) => b.status === BookProgressStatus.READ)
            .sort((a, b) => b.bookNumber - a.bookNumber);

          if (readBooks.length > 0) {
            const highestReadBook = readBooks[0];
            if (highestReadBook.bookNumber > existing.currentBookNumber) {
              existing.currentBook = highestReadBook.title;
              existing.currentBookNumber = highestReadBook.bookNumber;
            }
          }
        }
      }
    }

    return activeSeries;
  }

  /**
   * Check if a book is the next book in an active series
   */
  static isNextInActiveSeries(book: Book, activeSeries: ActiveSeries[]): boolean {
    const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);

    if (!seriesInfo.seriesName || !seriesInfo.bookNumber) {
      return false;
    }

    const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);

    // Find matching active series
    const matchingSeries = activeSeries.find(
      (s) =>
        s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
        s.normalizedAuthor === normalizedAuthor,
    );

    if (!matchingSeries) {
      return false;
    }

    // Check if this book is the next one in sequence
    const expectedNextNumber = matchingSeries.currentBookNumber + 1;
    return Math.abs(seriesInfo.bookNumber - expectedNextNumber) < 0.1; // Handle decimal book numbers
  }
}
