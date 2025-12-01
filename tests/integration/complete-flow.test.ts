import { GoodreadsCSVService } from '../../src/services/GoodreadsCSVService';
import { BookWeightingService } from '../../src/services/ToReadSeriesService';
import { ShelfType, WeightedBook } from '../../src/core/types';
import { sampleBooks } from '../fixtures/sampleData';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Integration: Complete Weighting Flow', () => {
    const testCSVPath = path.join(__dirname, '../fixtures/test-data.csv');
    
    beforeAll(async () => {
        // Create a test CSV file with proper escaping for series continuation testing
        const csvContent = [
            'Title,Author,Exclusive Shelf,Bookshelves',
            '"Witch\'s Dawn (Unholy Trinity, #1)","Crystal Ash","currently-reading",""',
            '"Witch\'s Twilight (Unholy Trinity, #2)","Crystal Ash","to-read",""',
            '"The Never Game (Colter Shaw, #1)","Jeffery Deaver","reading-next",""',
            '"The Final Twist (Colter Shaw, #2)","Jeffery Deaver","to-read",""',
            '"Some Random Book","Random Author","to-read",""',
            '"Another Standalone","Another Author","to-read",""'
        ].join('\n');
        
        await fs.writeFile(testCSVPath, csvContent);
    });

    afterAll(async () => {
        // Clean up test CSV file
        try {
            await fs.unlink(testCSVPath);
        } catch (error) {
            // File might not exist, ignore error
        }
    });

    it('should apply 5x weight to next books in active series', async () => {
        // Read to-read books
        const toReadBooks = await GoodreadsCSVService.getToReadBooks(testCSVPath);
        expect(toReadBooks.length).toBe(4);
        
        // Apply series continuation weighting
        const weightedBooks = await BookWeightingService.applyWeights(toReadBooks, testCSVPath);
        
        // Verify next books in series get 5x weight
        const nextUnholyBook = weightedBooks.find((wb: WeightedBook) => wb.book.Title.includes('Witch\'s Twilight'));
        expect(nextUnholyBook?.weight).toBe(5);
        expect(nextUnholyBook?.reason).toContain('Next book');
        
        const nextColterBook = weightedBooks.find((wb: WeightedBook) => wb.book.Title.includes('The Final Twist'));
        expect(nextColterBook?.weight).toBe(5);
        expect(nextColterBook?.reason).toContain('Next book');
        
        // Random books should have 1x weight
        const randomBook = weightedBooks.find((wb: WeightedBook) => wb.book.Title === 'Some Random Book');
        expect(randomBook?.weight).toBe(1);
        expect(randomBook?.reason).toBe('Standard weight');
    }, 8000);

    it('should filter books by shelf correctly', async () => {
        const toReadBooks = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.TO_READ);
        const currentlyReadingBooks = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.CURRENTLY_READING);
        const readingNextBooks = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.READING_NEXT);
        
        expect(toReadBooks.length).toBe(4);
        expect(currentlyReadingBooks.length).toBe(1);
        expect(readingNextBooks.length).toBe(1);
        expect(currentlyReadingBooks[0].Title).toContain('Unholy Trinity');
        expect(readingNextBooks[0].Title).toContain('Colter Shaw');
    }, 8000);

    it('should detect active series from currently-reading and reading-next shelves', async () => {
        const { ActiveSeriesService } = await import('../../src/services/ActiveSeriesService');
        const activeSeries = await ActiveSeriesService.detectActiveSeries(testCSVPath);
        
        expect(activeSeries.length).toBe(2); // Unholy Trinity and Colter Shaw
        
        const unholyTrinity = activeSeries.find(s => s.seriesName === 'Unholy Trinity');
        expect(unholyTrinity).toBeDefined();
        expect(unholyTrinity?.currentBookNumber).toBe(1);
        
        const colterShaw = activeSeries.find(s => s.seriesName === 'Colter Shaw');
        expect(colterShaw).toBeDefined();
        expect(colterShaw?.currentBookNumber).toBe(1);
    }, 8000);
});
