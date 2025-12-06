import { SeriesInfo } from '../core/types';

/**
 * Extract series information from a book title using various patterns
 */
export class SeriesDetector {
  /**
   * Extract series information from a book title
   */
  static extractSeriesInfo(title: string): SeriesInfo {
    const patterns = [
      // Pattern 1: "Book Title (Series Name, #1)" or "Book Title (Series Name #1)"
      /^(.+?)\s*\((.+?),?\s*#(\d+(?:\.\d+)?)\)/i,

      // Pattern 2: "Book Title (Series Name, Book 1)"
      /^(.+?)\s*\((.+?),?\s+(?:Book\s+)?(\d+(?:\.\d+)?)\)/i,

      // Pattern 3: "Series Name #1: Book Title" or "Series Name #1"
      /^(.+?)\s*#(\d+(?:\.\d+)?)(?::\s*(.+))?/i,
    ];

    // Try numbered patterns first
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        if (pattern === patterns[2]) {
          // Pattern 3: series name is first group, number is second
          return {
            seriesName: match[1].trim(),
            bookNumber: parseFloat(match[2]),
          };
        } else {
          // Patterns 1 & 2: series name is second group, number is third
          return {
            seriesName: match[2].trim(),
            bookNumber: parseFloat(match[3]),
          };
        }
      }
    }

    // Pattern 4: "Book Title (Series Name)" - no numbers
    const pattern4 = title.match(/^(.+?)\s*\((.+?)\)$/i);
    if (pattern4) {
      const seriesName = pattern4[2].trim();
      // Only consider it a series if it contains common series indicators or is shorter
      if (this.looksLikeSeries(seriesName)) {
        return {
          seriesName: seriesName,
          bookNumber: undefined,
        };
      }
    }

    // Pattern 5: "Series Name: Book Title"
    const pattern5 = title.match(/^(.+?):\s*(.+)/);
    if (pattern5) {
      const seriesName = pattern5[1].trim();
      if (this.looksLikeSeries(seriesName)) {
        return {
          seriesName: seriesName,
          bookNumber: undefined,
        };
      }
    }

    return { seriesName: null, bookNumber: undefined };
  }

  /**
   * Determine if a string looks like a series name
   */
  private static looksLikeSeries(name: string): boolean {
    // Check for common series indicators
    if (name.match(/\b(series|saga|chronicles|trilogy|cycle|book)\b/i)) {
      return true;
    }

    // Shorter names are more likely to be series names, but reject very long ones
    if (name.length <= 20 && !name.includes(',')) {
      return true;
    }

    return false;
  }

  /**
   * Normalize author name for consistent comparison
   */
  static normalizeAuthor(author: string): string {
    return author.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
