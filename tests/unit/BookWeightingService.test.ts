import { BookWeightingService } from '../../src/services/ToReadSeriesService';
import { sampleBooks } from '../fixtures/sampleData';

// Mock the ActiveSeriesService
jest.mock('../../src/services/ActiveSeriesService', () => ({
    ActiveSeriesService: {
        detectActiveSeries: jest.fn().mockResolvedValue([
            {
                seriesName: 'Unholy Trinity',
                author: 'Crystal Ash',
                currentBook: 'Witch\'s Dawn (Unholy Trinity, #1)',
                currentBookNumber: 1,
                normalizedAuthor: 'crystal ash'
            }
        ]),
        isNextInActiveSeries: jest.fn().mockImplementation((book) => {
            // Mock logic: only "Witch's Twilight #2" is the next book
            return book.Title.includes('Witch\'s Twilight') && book.Title.includes('#2');
        })
    }
}));

describe('BookWeightingService', () => {
    describe('applyWeights', () => {
        it('should give 5x weight to next books in active series', async () => {
            const testBooks = [
                {
                    Title: 'Witch\'s Twilight (Unholy Trinity, #2)',
                    Author: 'Crystal Ash',
                    Bookshelves: '',
                    'Exclusive Shelf': 'to-read'
                },
                {
                    Title: 'Some Random Book',
                    Author: 'Random Author',
                    Bookshelves: '',
                    'Exclusive Shelf': 'to-read'
                }
            ];

            const result = await BookWeightingService.applyWeights(testBooks, 'fake-path.csv');
            
            // Next book in series should have 5x weight
            const nextBook = result.find(wb => wb.book.Title.includes('Witch\'s Twilight'));
            expect(nextBook?.weight).toBe(5);
            expect(nextBook?.reason).toContain('Next book');
            
            // Random book should have 1x weight
            const randomBook = result.find(wb => wb.book.Title === 'Some Random Book');
            expect(randomBook?.weight).toBe(1);
            expect(randomBook?.reason).toBe('Standard weight');
        });

        it('should handle books with no active series', async () => {
            const testBooks = [
                {
                    Title: 'Standalone Book',
                    Author: 'Solo Author',
                    Bookshelves: '',
                    'Exclusive Shelf': 'to-read'
                }
            ];

            const result = await BookWeightingService.applyWeights(testBooks, 'fake-path.csv');
            
            expect(result).toHaveLength(1);
            expect(result[0].weight).toBe(1);
            expect(result[0].reason).toBe('Standard weight');
        });
    });
});
