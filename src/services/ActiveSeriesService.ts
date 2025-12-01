import { Book, ActiveSeries } from '../core/types';
import { SeriesDetector } from '../core/SeriesDetector';
import { GoodreadsCSVService } from './GoodreadsCSVService';

/**
 * Service for detecting active series based on currently reading and reading-next books
 */
export class ActiveSeriesService {
    
    /**
     * Detect active series from currently-reading, reading-next, and recently read books
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
                    normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author)
                });
            }
        }
        
        // Process recently read books (last 2 years to catch active series)
        const currentYear = new Date().getFullYear();
        const recentReadBooks = readBooks.filter(book => {
            if (!book['Date Read']) return false;
            const readDate = new Date(book['Date Read']);
            const readYear = readDate.getFullYear();
            return (currentYear - readYear) <= 1; // Books read within last 2 years
        });
        
        for (const book of recentReadBooks) {
            const seriesInfo = SeriesDetector.extractSeriesInfo(book.Title);
            if (seriesInfo.seriesName && seriesInfo.bookNumber) {
                // Check if this series is already tracked
                const existing = activeSeries.find(s => 
                    s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
                    s.normalizedAuthor === SeriesDetector.normalizeAuthor(book.Author)
                );
                
                if (!existing) {
                    activeSeries.push({
                        seriesName: seriesInfo.seriesName,
                        author: book.Author,
                        currentBook: book.Title,
                        currentBookNumber: seriesInfo.bookNumber,
                        normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author)
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
                const existing = activeSeries.find(s => 
                    s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
                    s.normalizedAuthor === SeriesDetector.normalizeAuthor(book.Author)
                );
                
                if (!existing) {
                    activeSeries.push({
                        seriesName: seriesInfo.seriesName,
                        author: book.Author,
                        currentBook: book.Title,
                        currentBookNumber: seriesInfo.bookNumber,
                        normalizedAuthor: SeriesDetector.normalizeAuthor(book.Author)
                    });
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
        const matchingSeries = activeSeries.find(s =>
            s.seriesName.toLowerCase() === seriesInfo.seriesName!.toLowerCase() &&
            s.normalizedAuthor === normalizedAuthor
        );
        
        if (!matchingSeries) {
            return false;
        }
        
        // Check if this book is the next one in sequence
        const expectedNextNumber = matchingSeries.currentBookNumber + 1;
        return Math.abs(seriesInfo.bookNumber - expectedNextNumber) < 0.1; // Handle decimal book numbers
    }
}
