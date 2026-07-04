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
import { LLMSeriesDetectionService } from './LLMSeriesDetectionService';

/**
 * Service for generating series progression timeline
 */
export class SeriesProgressionTimelineService {
  /**
   * Generate a timeline of series progression across all books
   */
  static async generateTimeline(csvFilePath: string): Promise<SeriesProgressionTimeline> {
    const allBooks = await GoodreadsCSVService.readAllBooks(csvFilePath);

    // Enrich series info for books whose titles lack series metadata
    if (LLMSeriesDetectionService.isAvailable()) {
      const needsLLM = allBooks
        .filter((b) => !SeriesDetector.extractSeriesInfo(b.Title).seriesName)
        .map((b) => ({ title: b.Title, author: b.Author }));
      if (needsLLM.length > 0) {
        const overrides = await LLMSeriesDetectionService.enrichMissingSeriesInfo(needsLLM);
        SeriesDetector.setLLMOverrides(overrides);
      }
    }

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

    // Pass 1.5: CJK read reconciliation
    // When a CJK bracket edition is "read" and the same author has exactly one English Vol.
    // series that is missing that volume number, add it as read. Applies only to "read"
    // shelf — to-read/reading-next CJK entries are intentionally ignored to avoid creating
    // phantom continuation books for foreign editions the user may not be tracking.
    const CJK_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9F]/;
    const BRACKET_VOL_RE = /^.+\s+(\d+(?:\.\d+)?)\s+\[.+?\s+\1\]$/;

    for (const book of allBooks) {
      if (!CJK_RE.test(book.Title)) continue;
      if (book['Exclusive Shelf']?.trim().toLowerCase() !== ShelfType.READ) continue;

      const bracketMatch = book.Title.match(BRACKET_VOL_RE);
      if (!bracketMatch) continue;

      const volNumber = parseFloat(bracketMatch[1]);
      const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);

      // Find all series by this author
      const authorSeries = [...seriesMap.values()].filter(
        (s) => s.normalizedAuthor === normalizedAuthor,
      );

      // Only reconcile when there is exactly one series — avoids guessing which
      // series the CJK volume belongs to when an author has multiple tracked series
      if (authorSeries.length !== 1) continue;

      const series = authorSeries[0];

      // Only fill if the volume is genuinely missing
      if (series.books.some((b) => b.bookNumber === volNumber)) continue;

      const dateRead = book['Date Read'] ? new Date(book['Date Read']) : undefined;
      series.books.push({
        title: book.Title,
        bookNumber: volNumber,
        status: BookProgressStatus.READ,
        dateRead,
        author: book.Author,
      });

      if (volNumber > series.highestBookNumber) {
        series.highestBookNumber = volNumber;
      }
    }

    // Second pass: handle books in series without explicit numbers
    // Collect unnumbered books for each series to infer their positions
    const unnumberedBooksBySeries = new Map<string, Array<{ book: Book; seriesName: string }>>();

    for (const book of allBooks) {
      // Skip CJK-titled books from unnumbered inference
      if (CJK_RE.test(book.Title)) {
        continue;
      }

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

            // Skip CJK-titled books — foreign-language auto-added editions should not
            // be inferred into an English series
            if (CJK_RE.test(book.Title)) {
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

    // Fourth-and-a-half pass: collapse duplicate editions of the same book.
    // GoodReads can shelve two editions of one book under different series numbers
    // (e.g. "Family of Liars (We Were Liars, #2)" read + "Family of Liars
    // (We Were Liars #0)" to-read). Merge same-title books within a series into one
    // entry, keeping the most-progressed copy so a read book is never shown as unread.
    this.dedupeSeriesBooksByTitle(seriesMap);

    // Fourth-and-three-quarters pass: rescue bare-title books whose title matches a
    // series name by the same author. GoodReads sometimes omits the series tag on the
    // flagship book (e.g. "We Were Liars" with no "(We Were Liars, #1)"), and the LLM
    // cannot disambiguate a title identical to its series name. Fold it into the
    // matching series, inferring its number from publication year.
    this.rescueBareTitleBooks(seriesMap, allBooks);

    // Fifth pass: merge alias series names (GoodReads inconsistency).
    // GoodReads sometimes exports the same series under a longer/variant name
    // (e.g. "Freaks (Jane Rizzoli & Maura Isles, #8.5)" vs the canonical
    // "Rizzoli & Isles"). Left un-merged, the odd-one-out lands in its own
    // single-book series and is dropped as "completed", so its book vanishes.
    //
    // Guarded token-subset rule: two series by the SAME author merge only when
    // every significant token of the shorter name appears in the longer name AND
    // they share at least 2 significant tokens. The 2-token guard prevents false
    // merges of single-distinctive-token sub-series (e.g. "Mistborn" vs
    // "Mistborn: Wax & Wayne"). The series with more books is treated as canonical.
    this.mergeAliasSeries(seriesMap);

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

      // A series counts as "started" if the reader has begun it from an entry point.
      // Two valid entry points, because GoodReads numbers optional prequel novellas
      // below #1 (e.g. 0.1, 0.5):
      //   1. the lowest-numbered book overall (covers series whose canonical start is a
      //      sub-#1 prequel that was actually read, e.g. Practical Magic #0.1), OR
      //   2. the first main book (lowest book with number >= 1) — so reading the #1 novel
      //      counts even when a fractional prequel (e.g. Colter Shaw #0.5) is still to-read.
      // This still hides series the reader jumped into mid-run (e.g. read #5 but not #1).
      const isStarted = (b: BookProgress | undefined): boolean =>
        !!b &&
        (b.status === BookProgressStatus.READ ||
          b.status === BookProgressStatus.CURRENTLY_READING ||
          b.status === BookProgressStatus.READING_NEXT);

      const firstBook = series.books[0]; // books already sorted ascending by book number above
      const firstMainBook = series.books.find((b) => b.bookNumber >= 1);

      const hasStartedSeries = isStarted(firstBook) || isStarted(firstMainBook);

      // Skip series that haven't been started (no valid entry point read/started)
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

  // Connector/filler words that carry no series-identity signal.
  private static readonly SERIES_STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'and',
    'of',
    'series',
    'saga',
    'chronicles',
    'trilogy',
    'cycle',
    'novel',
    'novels',
    'book',
    'books',
  ]);

  /**
   * Significant, lowercased word tokens of a series name (stopwords + punctuation removed).
   * "Jane Rizzoli & Maura Isles" -> {jane, rizzoli, maura, isles}
   */
  private static significantTokens(name: string): Set<string> {
    return new Set(
      name
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 0 && !this.SERIES_STOPWORDS.has(t)),
    );
  }

  /**
   * Merge alias series names in place. Two same-author series merge when the
   * shorter name's significant tokens are all contained in the longer name and
   * they share at least 2 significant tokens; books fold into the series with
   * more books (canonical). See the fifth-pass comment in generateTimeline.
   */
  private static mergeAliasSeries(seriesMap: Map<string, SeriesProgress>): void {
    const entries = [...seriesMap.entries()];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [keyA, a] = entries[i];
        const [keyB, b] = entries[j];

        // Skip if either was already merged away in an earlier iteration
        if (!seriesMap.has(keyA) || !seriesMap.has(keyB)) continue;
        if (a.normalizedAuthor !== b.normalizedAuthor) continue;

        const tokA = this.significantTokens(a.seriesName);
        const tokB = this.significantTokens(b.seriesName);
        const [smaller, larger] = tokA.size <= tokB.size ? [tokA, tokB] : [tokB, tokA];

        const shared = [...smaller].filter((t) => larger.has(t));
        const isSubset = shared.length === smaller.size;
        if (!isSubset || shared.length < 2) continue;

        // Canonical = more books; fold the other into it
        const [canonicalKey, canonical, otherKey, other] =
          a.books.length >= b.books.length ? [keyA, a, keyB, b] : [keyB, b, keyA, a];

        this.foldSeries(canonical, other);
        seriesMap.delete(otherKey);
        // Keep the entries array in sync so canonical's grown book list is seen
        entries[a.books.length >= b.books.length ? i : j] = [canonicalKey, canonical];
      }
    }
  }

  /** Fold source series' books into target, adding only book numbers target lacks. */
  private static foldSeries(target: SeriesProgress, source: SeriesProgress): void {
    for (const book of source.books) {
      const existing = target.books.find((b) => b.bookNumber === book.bookNumber);
      if (!existing) {
        target.books.push(book);
        if (book.bookNumber > target.highestBookNumber) {
          target.highestBookNumber = book.bookNumber;
        }
      } else if (
        book.status === BookProgressStatus.READ &&
        existing.status === BookProgressStatus.TO_READ
      ) {
        // Prefer the more-progressed copy when both aliases list the same number
        existing.status = book.status;
        existing.dateRead = book.dateRead;
      }
    }

    if (
      source.currentBookNumber !== undefined &&
      (target.currentBookNumber === undefined ||
        source.currentBookNumber < target.currentBookNumber)
    ) {
      target.currentBookNumber = source.currentBookNumber;
    }
  }

  /** A book title with any trailing parenthetical (series tag) stripped, lowercased. */
  private static normalizeBookTitle(title: string): string {
    return title
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim()
      .toLowerCase();
  }

  /** Reading-progress rank; higher wins when collapsing duplicate editions. */
  private static statusRank(status: BookProgressStatus): number {
    switch (status) {
      case BookProgressStatus.CURRENTLY_READING:
        return 4;
      case BookProgressStatus.READING_NEXT:
        return 3;
      case BookProgressStatus.READ:
        return 2;
      case BookProgressStatus.TO_READ:
        return 1;
      default:
        return 0;
    }
  }

  /** Publication year of a book (original preferred), or 9999 when unknown. */
  private static pubYearOf(book: Book): number {
    const raw = book['Original Publication Year'] || book['Year Published'];
    const year = raw ? parseInt(raw) : NaN;
    return Number.isNaN(year) ? 9999 : year;
  }

  /**
   * Collapse books that share a normalized title within each series, keeping the
   * most-progressed copy. Handles GoodReads shelving two editions of one book under
   * different series numbers (e.g. Family of Liars as both #0 and #2).
   */
  private static dedupeSeriesBooksByTitle(seriesMap: Map<string, SeriesProgress>): void {
    for (const series of seriesMap.values()) {
      const byTitle = new Map<string, BookProgress>();
      for (const book of series.books) {
        const key = this.normalizeBookTitle(book.title);
        const existing = byTitle.get(key);
        if (!existing || this.statusRank(book.status) > this.statusRank(existing.status)) {
          byTitle.set(key, book);
        }
      }
      series.books = [...byTitle.values()];
      series.highestBookNumber = series.books.reduce((m, b) => Math.max(m, b.bookNumber), 0);
    }
  }

  /**
   * Fold bare-title books (no series tag detected) into a same-author series whose
   * name appears in the title, inferring the book number from publication year.
   * Matching on "contains" (not just equals) also catches companion titles such as
   * "We Fell Apart: A We Were Liars Novel". The longest matching series name wins so
   * the most specific series is chosen when several could match.
   */
  private static rescueBareTitleBooks(
    seriesMap: Map<string, SeriesProgress>,
    allBooks: Book[],
  ): void {
    for (const book of allBooks) {
      const titleKey = this.normalizeBookTitle(book.Title);
      const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);

      // Skip books already grouped into a series (via an explicit tag). Titles are
      // compared with their series parenthetical stripped, so a normally-tagged book
      // like "The Goodbye Man (Colter Shaw, #2)" is recognized as already placed.
      const alreadyGrouped = [...seriesMap.values()].some(
        (s) =>
          s.normalizedAuthor === normalizedAuthor &&
          s.books.some((b) => this.normalizeBookTitle(b.title) === titleKey),
      );
      if (alreadyGrouped) continue;

      // Fold into the series whose name appears in the (tag-stripped) title. Longest
      // series name wins so the most specific series is chosen.
      const target = [...seriesMap.values()]
        .filter(
          (s) =>
            s.normalizedAuthor === normalizedAuthor &&
            titleKey.includes(s.seriesName.toLowerCase()),
        )
        .sort((a, b) => b.seriesName.length - a.seriesName.length)[0];
      if (!target) continue;

      // Already present (or a re-run) — do not double-add
      if (target.books.some((b) => this.normalizeBookTitle(b.title) === titleKey)) continue;

      const shelf = book['Exclusive Shelf']?.trim().toLowerCase();
      let status: BookProgressStatus;
      let dateRead: Date | undefined;
      if (shelf === ShelfType.READ) {
        status = BookProgressStatus.READ;
        if (book['Date Read']) dateRead = new Date(book['Date Read']);
      } else if (shelf === ShelfType.CURRENTLY_READING) {
        status = BookProgressStatus.CURRENTLY_READING;
      } else if (shelf === ShelfType.READING_NEXT) {
        status = BookProgressStatus.READING_NEXT;
      } else if (shelf === ShelfType.TO_READ) {
        status = BookProgressStatus.TO_READ;
      } else {
        status = BookProgressStatus.NOT_STARTED;
      }

      const assignedNumber = this.inferBareTitleNumber(target, this.pubYearOf(book), allBooks);

      target.books.push({
        title: book.Title,
        bookNumber: assignedNumber,
        status,
        dateRead,
        author: book.Author,
      });
      if (assignedNumber > target.highestBookNumber) {
        target.highestBookNumber = assignedNumber;
      }
      if (
        status === BookProgressStatus.CURRENTLY_READING &&
        (target.currentBookNumber === undefined || assignedNumber < target.currentBookNumber)
      ) {
        target.currentBookNumber = assignedNumber;
      }
    }
  }

  /**
   * Infer a book number for a bare-title book. If it is the earliest-published book
   * in the series and #1 is free, it is the flagship first book; otherwise take the
   * smallest free positive integer.
   */
  private static inferBareTitleNumber(
    series: SeriesProgress,
    pubYear: number,
    allBooks: Book[],
  ): number {
    const usedNumbers = new Set(series.books.map((b) => b.bookNumber));

    const existingPubYears = series.books.map((b) => {
      const orig = allBooks.find((bk) => bk.Title === b.title);
      return orig ? this.pubYearOf(orig) : 9999;
    });
    const minExistingPub = existingPubYears.length ? Math.min(...existingPubYears) : Infinity;

    if (pubYear <= minExistingPub && !usedNumbers.has(1)) {
      return 1;
    }

    let n = 1;
    while (usedNumbers.has(n)) n++;
    return n;
  }
}
