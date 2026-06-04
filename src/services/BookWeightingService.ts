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
   */
  static async applyWeights(books: Book[], csvFilePath: string): Promise<WeightedBook[]> {
    const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);

    return Promise.all(
      books.map(async (book) => {
        if (
          await ActiveSeriesService.isNextInActiveSeriesWithProgressive(
            book,
            activeSeries,
            csvFilePath,
          )
        ) {
          const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
          const normalizedAuthor = SeriesDetector.normalizeAuthor(book.Author);
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

        return {
          book,
          weight: 1,
          reason: 'Standard weight',
        };
      }),
    );
  }
}
