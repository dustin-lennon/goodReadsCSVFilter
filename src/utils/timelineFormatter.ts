import {
  SeriesProgressionTimeline,
  SeriesProgress,
  BookProgress,
  BookProgressStatus,
} from '../core/types';

/**
 * Format series progression timeline for CLI display
 */
export class TimelineFormatter {
  /**
   * Format the complete timeline for CLI output
   */
  static formatTimeline(timeline: SeriesProgressionTimeline): string {
    const lines: string[] = [];

    lines.push('\n📈 Series Progression Timeline');
    lines.push('=====================================\n');

    if (timeline.series.length === 0) {
      lines.push('   No series found in your library.\n');
      return lines.join('\n');
    }

    lines.push(`📊 Overview:`);
    lines.push(`   • Total Series: ${timeline.totalSeries}`);
    lines.push(`   • Books Read: ${timeline.totalBooksRead}`);
    lines.push(`   • Books In Progress: ${timeline.totalBooksInProgress}\n`);

    timeline.series.forEach((series, index) => {
      lines.push(this.formatSeriesProgress(series, index + 1));
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Format a single series progress for display
   */
  private static formatSeriesProgress(series: SeriesProgress, index: number): string {
    const lines: string[] = [];

    lines.push(`${index}. ${series.seriesName} by ${series.author}`);
    lines.push(
      `   Progress: ${series.booksRead} read, ${series.booksInProgress} in progress, ${series.booksToRead} to read`,
    );
    lines.push(`   Completion: ${series.completionPercentage.toFixed(1)}%`);

    if (series.currentBookNumber) {
      lines.push(`   Currently on: Book #${series.currentBookNumber}`);
    }

    if (series.firstReadDate && series.lastReadDate) {
      const firstDate = series.firstReadDate.toLocaleDateString();
      const lastDate = series.lastReadDate.toLocaleDateString();
      if (firstDate === lastDate) {
        lines.push(`   Dates: ${firstDate}`);
      } else {
        lines.push(`   Dates: ${firstDate} - ${lastDate}`);
      }
    }

    // Show book progression timeline
    if (series.books.length > 0) {
      lines.push(`   Timeline:`);

      // Group consecutive books with the same status
      // Only group if books are truly consecutive (no gaps) AND have the same status
      let currentGroup: BookProgress[] = [];
      const groups: BookProgress[][] = [];

      for (let i = 0; i < series.books.length; i++) {
        const book = series.books[i];
        const prevBook = i > 0 ? series.books[i - 1] : null;

        if (!prevBook) {
          // First book - start a new group
          currentGroup = [book];
          continue;
        }

        // Check if this book should be grouped with the previous one
        // Books must be: consecutive (no gaps) AND have the same status
        const bookNumDiff = book.bookNumber - prevBook.bookNumber;
        const isConsecutive =
          bookNumDiff === 1 ||
          (bookNumDiff === 0.1 && prevBook.bookNumber % 1 !== 0) ||
          (bookNumDiff === 0.5 && Math.floor(prevBook.bookNumber) === Math.floor(book.bookNumber));
        const sameStatus = book.status === prevBook.status;

        if (isConsecutive && sameStatus && currentGroup.length > 0) {
          currentGroup.push(book);
        } else {
          // Start a new group - save the current one
          if (currentGroup.length > 0) {
            groups.push([...currentGroup]);
          }
          currentGroup = [book];
        }
      }
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }

      // Format groups - show individual books or ranges
      groups.forEach((group) => {
        if (group.length === 1) {
          // Single book - show individually
          const book = group[0];
          const statusIcon = this.getStatusIcon(book.status);
          const statusText = this.getStatusText(book.status);
          const dateStr = book.dateRead ? ` (${book.dateRead.toLocaleDateString()})` : '';
          lines.push(`      ${statusIcon} Book #${book.bookNumber}: ${statusText}${dateStr}`);
        } else {
          // Multiple books - show as range only if all same status (already verified)
          const first = group[0];
          const last = group[group.length - 1];
          const statusIcon = this.getStatusIcon(first.status);
          const statusText = this.getStatusText(first.status);

          // Verify all books in group have same status (safety check)
          const allSameStatus = group.every((b) => b.status === first.status);

          if (allSameStatus && first.bookNumber !== last.bookNumber) {
            // Show as range
            lines.push(
              `      ${statusIcon} Books #${first.bookNumber}-#${last.bookNumber}: ${statusText}`,
            );
          } else {
            // Show individually if status differs or same number
            group.forEach((book) => {
              const dateStr = book.dateRead ? ` (${book.dateRead.toLocaleDateString()})` : '';
              lines.push(`      ${statusIcon} Book #${book.bookNumber}: ${statusText}${dateStr}`);
            });
          }
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * Get icon for book status
   */
  private static getStatusIcon(status: BookProgressStatus): string {
    switch (status) {
      case BookProgressStatus.READ:
        return '✅';
      case BookProgressStatus.CURRENTLY_READING:
        return '📖';
      case BookProgressStatus.READING_NEXT:
        return '🔜';
      case BookProgressStatus.TO_READ:
        return '📚';
      default:
        return '⚪';
    }
  }

  /**
   * Get text description for book status
   */
  private static getStatusText(status: BookProgressStatus): string {
    switch (status) {
      case BookProgressStatus.READ:
        return 'Read';
      case BookProgressStatus.CURRENTLY_READING:
        return 'Currently Reading';
      case BookProgressStatus.READING_NEXT:
        return 'Reading Next';
      case BookProgressStatus.TO_READ:
        return 'To Read';
      default:
        return 'Not Started';
    }
  }
}
