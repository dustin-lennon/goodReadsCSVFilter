import { Book, WeightedBook } from '../core/types';
import { ActiveSeriesService } from './ActiveSeriesService';

/**
 * Service for applying weights to books based on series continuation
 */
export class BookWeightingService {
    
    /**
     * Apply weights to books with priority for series continuation
     */
    static async applyWeights(books: Book[], csvFilePath: string): Promise<WeightedBook[]> {
        // Detect active series from currently-reading and reading-next shelves
        const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);
        
        // Optional: Enable for debugging
        // console.log(`🧠 Found ${activeSeries.length} active series:`);
        // activeSeries.forEach(series => {
        //     console.log(`   📖 ${series.seriesName} by ${series.author} (currently on book ${series.currentBookNumber})`);
        // });
        
        return books.map(book => {
            // Check if this book is the next in an active series
            if (ActiveSeriesService.isNextInActiveSeries(book, activeSeries)) {
                const matchingSeries = activeSeries.find(s => {
                    const bookSeries = book.Title.match(/\((.+?)[,#]/)?.[1];
                    return bookSeries && s.seriesName.toLowerCase().includes(bookSeries.toLowerCase());
                });
                
                return {
                    book,
                    weight: 5,
                    reason: `Next book in ${matchingSeries?.seriesName || 'active'} series`
                };
            }
            
            // Default weight for all other books
            return {
                book,
                weight: 1,
                reason: 'Standard weight'
            };
        });
    }
}
