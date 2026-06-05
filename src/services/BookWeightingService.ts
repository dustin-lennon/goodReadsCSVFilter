import { Book, WeightedBook } from '../core/types';
import { ActiveSeriesService } from './ActiveSeriesService';
import { SeriesDetector } from '../core/SeriesDetector';

/**
 * Service for applying weights to books based on series continuation
 */
export class BookWeightingService {
  /**
   * Apply weights to books with priority for series continuation.
   * Uses Progressive-series-aware detection so SAO: Progressive gates SAO main series.
   * Pre-computes the actual next book number per active series so decimal sequences
   * (e.g. 0.1 → 0.2 → 1 → 2) work correctly instead of assuming +1.
   */
  static async applyWeights(books: Book[], csvFilePath: string): Promise<WeightedBook[]> {
    const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);

    // For each active series, find the actual next book number from the available
    // to-read books — the smallest book number greater than currentBookNumber.
    // This handles non-integer sequences like 0.1 → 0.2 → 1 → 2 correctly.
    const nextBookNumberMap = new Map<string, number>();
    for (const series of activeSeries) {
      const key = `${series.seriesName.toLowerCase()}|${series.normalizedAuthor}`;
      const candidates = books
        .map((b) => ({
          info: SeriesDetector.extractSeriesInfo(b.Title),
          author: SeriesDetector.normalizeAuthor(b.Author),
        }))
        .filter(
          ({ info, author }) =>
            info.seriesName?.toLowerCase() === series.seriesName.toLowerCase() &&
            author === series.normalizedAuthor &&
            info.bookNumber !== undefined &&
            info.bookNumber > series.currentBookNumber,
        )
        .sort((a, b) => a.info.bookNumber! - b.info.bookNumber!);

      if (candidates.length > 0) {
        nextBookNumberMap.set(key, candidates[0].info.bookNumber!);
      }
    }

    return Promise.all(
      books.map(async (book) => {
        const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
        const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);

        if (seriesInfo.seriesName && seriesInfo.bookNumber !== undefined) {
          const key = `${seriesInfo.seriesName.toLowerCase()}|${normalizedAuthor}`;
          const nextBookNumber = nextBookNumberMap.get(key);

          // Book matches if its number is the computed next AND passes the
          // Progressive series gate (which handles SAO: Progressive → SAO ordering)
          if (
            nextBookNumber !== undefined &&
            Math.abs(seriesInfo.bookNumber - nextBookNumber) < 0.001 &&
            (await ActiveSeriesService.isNextInActiveSeriesWithProgressive(
              book,
              activeSeries,
              csvFilePath,
              nextBookNumberMap,
            ))
          ) {
            const matchingSeries = activeSeries.find(
              (s) =>
                s.seriesName.toLowerCase() === seriesInfo.seriesName?.toLowerCase() &&
                s.normalizedAuthor === normalizedAuthor,
            );
            return {
              book,
              weight: 5,
              reason: `Next book in ${matchingSeries?.seriesName || 'active'} series`,
            };
          }
        }

        return {
          book,
          weight: 1,
          reason: 'Standard weight',
        };
      }),
    );
  }
}
