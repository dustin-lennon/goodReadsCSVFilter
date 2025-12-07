import {
  Book,
  SeriesProgress,
  BookProgress,
  SeriesProgressionTimeline,
  BookProgressStatus,
  ShelfType,
} from '../core/types';
import { GoodreadsCSVService } from './GoodreadsCSVService';
import { SeriesDetector } from '../core/SeriesDetector';

/**
 * Service for generating series progression timeline
 */
export class SeriesProgressionTimelineService {
  /**
   * Generate a timeline of series progression across all books
   */
  static async generateTimeline(csvFilePath: string): Promise<SeriesProgressionTimeline> {
    const allBooks = await GoodreadsCSVService.readAllBooks(csvFilePath);

    // Group books by series
    const seriesMap = new Map<string, SeriesProgress>();

    // First pass: collect all books with explicit numbers
    for (const book of allBooks) {
      const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);

      // Skip books without series information or without explicit numbers for now
      if (!seriesInfo.seriesName || seriesInfo.bookNumber === undefined) {
        continue;
      }

      const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);
      const seriesKey = `${seriesInfo.seriesName.toLowerCase()}|${normalizedAuthor}`;

      // Initialize series if not exists
      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, {
          seriesName: seriesInfo.seriesName,
          author: book.Author,
          normalizedAuthor: normalizedAuthor,
          books: [],
          highestBookNumber: 0,
          booksRead: 0,
          booksInProgress: 0,
          booksToRead: 0,
          completionPercentage: 0,
          currentBookNumber: undefined,
        });
      }

      const series = seriesMap.get(seriesKey)!;

      // Determine book status
      const shelf = book['Exclusive Shelf']?.trim().toLowerCase();
      let status: BookProgressStatus;
      let dateRead: Date | undefined;

      if (shelf === ShelfType.READ) {
        status = BookProgressStatus.READ;
        if (book['Date Read']) {
          dateRead = new Date(book['Date Read']);
        }
      } else if (shelf === ShelfType.CURRENTLY_READING) {
        status = BookProgressStatus.CURRENTLY_READING;
        if (!series.currentBookNumber || seriesInfo.bookNumber < series.currentBookNumber) {
          series.currentBookNumber = seriesInfo.bookNumber;
        }
      } else if (shelf === ShelfType.READING_NEXT) {
        status = BookProgressStatus.READING_NEXT;
      } else if (shelf === ShelfType.TO_READ) {
        status = BookProgressStatus.TO_READ;
      } else {
        status = BookProgressStatus.NOT_STARTED;
      }

      // Create book progress entry
      const bookProgress: BookProgress = {
        title: book.Title,
        bookNumber: seriesInfo.bookNumber,
        status: status,
        dateRead: dateRead,
        author: book.Author,
      };

      // Add or update book in series
      const existingBookIndex = series.books.findIndex(
        (b) => b.bookNumber === seriesInfo.bookNumber,
      );
      if (existingBookIndex >= 0) {
        // Update existing book (in case it appears in multiple shelves)
        const existingBook = series.books[existingBookIndex];
        // Prioritize: currently-reading > reading-next > to-read > read
        if (
          status === BookProgressStatus.CURRENTLY_READING ||
          status === BookProgressStatus.READING_NEXT
        ) {
          series.books[existingBookIndex] = bookProgress;
        } else if (
          status === BookProgressStatus.READ &&
          existingBook.status !== BookProgressStatus.CURRENTLY_READING
        ) {
          series.books[existingBookIndex] = bookProgress;
        }
      } else {
        series.books.push(bookProgress);
      }

      // Update highest book number
      if (seriesInfo.bookNumber > series.highestBookNumber) {
        series.highestBookNumber = seriesInfo.bookNumber;
      }
    }

    // Second pass: handle books in series without explicit numbers
    // Collect unnumbered books for each series to infer their positions
    const unnumberedBooksBySeries = new Map<string, Array<{ book: Book; seriesName: string }>>();

    for (const book of allBooks) {
      const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);

      // Only process books that are in a series but don't have explicit numbers
      if (!seriesInfo.seriesName || seriesInfo.bookNumber !== undefined) {
        continue;
      }

      const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);
      const seriesKey = `${seriesInfo.seriesName.toLowerCase()}|${normalizedAuthor}`;

      // Only consider unnumbered books if the series already exists (has numbered books)
      if (!seriesMap.has(seriesKey)) {
        continue;
      }

      if (!unnumberedBooksBySeries.has(seriesKey)) {
        unnumberedBooksBySeries.set(seriesKey, []);
      }

      unnumberedBooksBySeries.get(seriesKey)!.push({ book, seriesName: seriesInfo.seriesName });
    }

    // Third pass: infer book numbers for unnumbered books based on publication date
    for (const [seriesKey, unnumberedBooks] of unnumberedBooksBySeries.entries()) {
      const series = seriesMap.get(seriesKey);
      if (!series || series.books.length === 0) {
        continue;
      }

      // Get publication years for numbered books
      const numberedBooksWithYears = series.books.map((b) => {
        // Find the original book to get publication year
        const originalBook = allBooks.find((book) => {
          const info = SeriesDetector.extractSeriesInfo(book.Title);
          return (
            info.seriesName?.toLowerCase() === series.seriesName.toLowerCase() &&
            info.bookNumber === b.bookNumber &&
            book.Author === b.author
          );
        });

        const pubYear = originalBook?.['Original Publication Year']
          ? parseInt(originalBook['Original Publication Year'])
          : originalBook?.['Year Published']
            ? parseInt(originalBook['Year Published'])
            : null;

        return { bookProgress: b, pubYear: pubYear || 9999 };
      });

      // Sort numbered books by publication year
      numberedBooksWithYears.sort((a, b) => a.pubYear - b.pubYear);

      // Get publication years for unnumbered books
      const unnumberedWithYears = unnumberedBooks.map(({ book, seriesName }) => {
        const pubYear = book['Original Publication Year']
          ? parseInt(book['Original Publication Year'])
          : book['Year Published']
            ? parseInt(book['Year Published'])
            : null;
        return { book, seriesName, pubYear: pubYear || 9999 };
      });

      // Sort unnumbered books by publication year
      unnumberedWithYears.sort((a, b) => a.pubYear - b.pubYear);

      // Infer book numbers: if unnumbered books are published before the earliest numbered book,
      // assign them sequential numbers starting from 1
      const earliestNumberedBook = numberedBooksWithYears[0];
      const earliestNumberedBookNum = earliestNumberedBook.bookProgress.bookNumber;

      if (earliestNumberedBookNum > 1 && unnumberedWithYears.length > 0) {
        // Check if unnumbered books are published before the earliest numbered book
        const unnumberedBeforeFirst = unnumberedWithYears.filter(
          (u) =>
            u.pubYear < earliestNumberedBook.pubYear ||
            (u.pubYear === earliestNumberedBook.pubYear && earliestNumberedBookNum > 1),
        );

        if (unnumberedBeforeFirst.length > 0) {
          // Assign sequential numbers starting from 1
          let assignedNumber = 1;
          for (const { book } of unnumberedBeforeFirst) {
            // Only assign if we don't already have a book with this number
            if (!series.books.some((b) => b.bookNumber === assignedNumber)) {
              const shelf = book['Exclusive Shelf']?.trim().toLowerCase();
              let status: BookProgressStatus;
              let dateRead: Date | undefined;

              if (shelf === ShelfType.READ) {
                status = BookProgressStatus.READ;
                if (book['Date Read']) {
                  dateRead = new Date(book['Date Read']);
                }
              } else if (shelf === ShelfType.CURRENTLY_READING) {
                status = BookProgressStatus.CURRENTLY_READING;
                if (!series.currentBookNumber || assignedNumber < series.currentBookNumber) {
                  series.currentBookNumber = assignedNumber;
                }
              } else if (shelf === ShelfType.READING_NEXT) {
                status = BookProgressStatus.READING_NEXT;
              } else if (shelf === ShelfType.TO_READ) {
                status = BookProgressStatus.TO_READ;
              } else {
                status = BookProgressStatus.NOT_STARTED;
              }

              const bookProgress: BookProgress = {
                title: book.Title,
                bookNumber: assignedNumber,
                status: status,
                dateRead: dateRead,
                author: book.Author,
              };

              series.books.push(bookProgress);

              if (assignedNumber > series.highestBookNumber) {
                series.highestBookNumber = assignedNumber;
              }
            }

            assignedNumber++;

            // Stop if we've reached the earliest numbered book
            if (assignedNumber >= earliestNumberedBookNum) {
              break;
            }
          }
        }
      }
    }

    // Fourth pass: find books by the same author with no series information that fall between numbered books
    // This handles cases like "The Mephisto Club" which is book #6 but has no series indicator in the title
    for (const series of seriesMap.values()) {
      if (series.books.length < 2) {
        continue; // Need at least 2 numbered books to infer gaps
      }

      // Get all numbered books with publication years and book numbers
      const numberedBooksData = series.books
        .map((b) => {
          const originalBook = allBooks.find((book) => {
            const info = SeriesDetector.extractSeriesInfo(book.Title);
            return (
              info.seriesName?.toLowerCase() === series.seriesName.toLowerCase() &&
              info.bookNumber === b.bookNumber &&
              SeriesDetector.normalizeAuthor(book.Author) === series.normalizedAuthor
            );
          });

          const pubYear = originalBook?.['Original Publication Year']
            ? parseInt(originalBook['Original Publication Year'])
            : originalBook?.['Year Published']
              ? parseInt(originalBook['Year Published'])
              : null;

          return {
            bookProgress: b,
            bookNumber: b.bookNumber,
            pubYear: pubYear || 9999,
            originalBook: originalBook,
          };
        })
        .filter((b) => b.originalBook); // Only include books we found

      // Sort by book number to find gaps
      numberedBooksData.sort((a, b) => a.bookNumber - b.bookNumber);

      // Find gaps between consecutive book numbers
      for (let i = 0; i < numberedBooksData.length - 1; i++) {
        const currentBook = numberedBooksData[i];
        const nextBook = numberedBooksData[i + 1];

        // Check if there's a gap (e.g., book #5 then #7, missing #6)
        if (nextBook.bookNumber - currentBook.bookNumber > 1) {
          // Look for books by the same author published between these two books
          const missingNumbers = [];
          for (let num = currentBook.bookNumber + 1; num < nextBook.bookNumber; num++) {
            missingNumbers.push(num);
          }

          // Find books by the same author with no series info published between these dates
          const booksBetween = allBooks.filter((book) => {
            // Must be by the same author
            if (SeriesDetector.normalizeAuthor(book.Author) !== series.normalizedAuthor) {
              return false;
            }

            // Must not already be in the series
            if (series.books.some((b) => b.title === book.Title)) {
              return false;
            }

            // Must not have series information in title
            const info = SeriesDetector.extractSeriesInfo(book.Title);
            if (info.seriesName) {
              return false;
            }

            // Must be published between the two books
            const pubYear = book['Original Publication Year']
              ? parseInt(book['Original Publication Year'])
              : book['Year Published']
                ? parseInt(book['Year Published'])
                : null;

            if (!pubYear) {
              return false;
            }

            return pubYear >= currentBook.pubYear && pubYear <= nextBook.pubYear;
          });

          // Sort by publication year and assign missing numbers
          booksBetween.sort((a, b) => {
            const yearA = parseInt(a['Original Publication Year'] || a['Year Published'] || '9999');
            const yearB = parseInt(b['Original Publication Year'] || b['Year Published'] || '9999');
            return yearA - yearB;
          });

          // Assign book numbers to books that fit in the gaps
          for (let j = 0; j < Math.min(booksBetween.length, missingNumbers.length); j++) {
            const book = booksBetween[j];
            const assignedNumber = missingNumbers[j];

            // Double-check we don't already have this number
            if (!series.books.some((b) => b.bookNumber === assignedNumber)) {
              const shelf = book['Exclusive Shelf']?.trim().toLowerCase();
              let status: BookProgressStatus;
              let dateRead: Date | undefined;

              if (shelf === ShelfType.READ) {
                status = BookProgressStatus.READ;
                if (book['Date Read']) {
                  dateRead = new Date(book['Date Read']);
                }
              } else if (shelf === ShelfType.CURRENTLY_READING) {
                status = BookProgressStatus.CURRENTLY_READING;
                if (!series.currentBookNumber || assignedNumber < series.currentBookNumber) {
                  series.currentBookNumber = assignedNumber;
                }
              } else if (shelf === ShelfType.READING_NEXT) {
                status = BookProgressStatus.READING_NEXT;
              } else if (shelf === ShelfType.TO_READ) {
                status = BookProgressStatus.TO_READ;
              } else {
                status = BookProgressStatus.NOT_STARTED;
              }

              const bookProgress: BookProgress = {
                title: book.Title,
                bookNumber: assignedNumber,
                status: status,
                dateRead: dateRead,
                author: book.Author,
              };

              series.books.push(bookProgress);

              if (assignedNumber > series.highestBookNumber) {
                series.highestBookNumber = assignedNumber;
              }
            }
          }
        }
      }
    }

    // Process each series to calculate statistics
    const seriesArray: SeriesProgress[] = [];
    let totalBooksRead = 0;
    let totalBooksInProgress = 0;

    for (const series of seriesMap.values()) {
      // Sort books by book number
      series.books.sort((a, b) => a.bookNumber - b.bookNumber);

      // Only include series where the first book (lowest book number, typically #1) has been started
      // This ensures we only show series that the user has actually begun from the start
      if (series.books.length === 0) {
        continue;
      }

      // Find the first book in the series (lowest book number)
      // Try book #1 first, then fall back to the lowest book number
      const bookOne = series.books.find((b) => b.bookNumber === 1);
      const firstBook = bookOne || series.books[0]; // Use book #1 if exists, otherwise lowest number

      const hasStartedSeries =
        firstBook &&
        (firstBook.status === BookProgressStatus.READ ||
          firstBook.status === BookProgressStatus.CURRENTLY_READING ||
          firstBook.status === BookProgressStatus.READING_NEXT);

      // Skip series that haven't been started (first book not read/started)
      if (!hasStartedSeries) {
        continue;
      }

      // Calculate statistics
      series.booksRead = series.books.filter((b) => b.status === BookProgressStatus.READ).length;
      series.booksInProgress = series.books.filter(
        (b) =>
          b.status === BookProgressStatus.CURRENTLY_READING ||
          b.status === BookProgressStatus.READING_NEXT,
      ).length;
      series.booksToRead = series.books.filter(
        (b) => b.status === BookProgressStatus.TO_READ,
      ).length;

      // Filter out completed series (all books read, nothing in progress or to-read)
      const isCompleted =
        series.booksRead === series.books.length &&
        series.booksInProgress === 0 &&
        series.booksToRead === 0;
      if (isCompleted) {
        continue; // Skip completed series
      }

      // Calculate completion percentage (based on total unique books tracked)
      // Use the total number of books we're tracking, not the highest book number
      // because book numbers can be non-sequential (0.5, 1.5, etc.) and we can't
      // know the true total number of books in the series from just the highest number
      const totalBooksTracked = series.books.length;
      if (totalBooksTracked > 0) {
        series.completionPercentage = Math.min((series.booksRead / totalBooksTracked) * 100, 100);
      }

      // Find first and last read dates
      const readBooks = series.books
        .filter((b) => b.status === BookProgressStatus.READ && b.dateRead)
        .sort((a, b) => a.dateRead!.getTime() - b.dateRead!.getTime());

      if (readBooks.length > 0) {
        series.firstReadDate = readBooks[0].dateRead;
        series.lastReadDate = readBooks[readBooks.length - 1].dateRead;
      }

      totalBooksRead += series.booksRead;
      totalBooksInProgress += series.booksInProgress;

      seriesArray.push(series);
    }

    // Sort series by last read date (most recent first), then by series name
    seriesArray.sort((a, b) => {
      if (a.lastReadDate && b.lastReadDate) {
        return b.lastReadDate.getTime() - a.lastReadDate.getTime();
      }
      if (a.lastReadDate) return -1;
      if (b.lastReadDate) return 1;
      return a.seriesName.localeCompare(b.seriesName);
    });

    return {
      series: seriesArray,
      totalSeries: seriesArray.length,
      totalBooksRead: totalBooksRead,
      totalBooksInProgress: totalBooksInProgress,
    };
  }
}
