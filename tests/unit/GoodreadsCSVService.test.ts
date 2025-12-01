import { GoodreadsCSVService } from '../../src/services/GoodreadsCSVService';
import { ShelfType } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('GoodreadsCSVService', () => {
    const testCSVPath = path.join(__dirname, '../fixtures/goodreads-service-test.csv');

    beforeAll(async () => {
        // Create a comprehensive test CSV file
        const csvContent = [
            'Title,Author,Exclusive Shelf,Bookshelves',
            '"Book 1","Author 1","to-read",""',
            '"Book 2","Author 2","currently-reading",""',
            '"Book 3","Author 3","reading-next",""',
            '"Book 4","Author 4","read",""',
            '"Book 5","Author 5","to-read","favorites"'
        ].join('\n');
        
        await fs.writeFile(testCSVPath, csvContent);
    });

    afterAll(async () => {
        try {
            await fs.unlink(testCSVPath);
        } catch (error) {
            // File might not exist, ignore error
        }
    });

    describe('readAllBooks', () => {
        it('should read all books from CSV file', async () => {
            const books = await GoodreadsCSVService.readAllBooks(testCSVPath);
            
            expect(books).toHaveLength(5);
            expect(books[0].Title).toBe('Book 1');
            expect(books[0].Author).toBe('Author 1');
            expect(books[0]['Exclusive Shelf']).toBe('to-read');
        });

        it('should handle empty CSV files', async () => {
            const emptyCSVPath = path.join(__dirname, '../fixtures/empty.csv');
            const csvContent = 'Title,Author,Exclusive Shelf,Bookshelves\n'; // Just headers
            
            await fs.writeFile(emptyCSVPath, csvContent);
            
            try {
                const books = await GoodreadsCSVService.readAllBooks(emptyCSVPath);
                expect(books).toHaveLength(0);
            } finally {
                await fs.unlink(emptyCSVPath);
            }
        });

        it('should handle invalid CSV format', async () => {
            const invalidCSVPath = path.join(__dirname, '../fixtures/invalid.csv');
            await fs.writeFile(invalidCSVPath, 'invalid,csv,content\nwithout,proper,headers');
            
            try {
                const books = await GoodreadsCSVService.readAllBooks(invalidCSVPath);
                // Should still work but with unexpected structure
                expect(Array.isArray(books)).toBe(true);
            } finally {
                await fs.unlink(invalidCSVPath);
            }
        });
    });

    describe('getBooksByShelf', () => {
        it('should filter books by to-read shelf', async () => {
            const books = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.TO_READ);
            
            expect(books).toHaveLength(2);
            expect(books.every(book => book['Exclusive Shelf'] === 'to-read')).toBe(true);
        });

        it('should filter books by currently-reading shelf', async () => {
            const books = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.CURRENTLY_READING);
            
            expect(books).toHaveLength(1);
            expect(books[0]['Exclusive Shelf']).toBe('currently-reading');
        });

        it('should filter books by reading-next shelf', async () => {
            const books = await GoodreadsCSVService.getBooksByShelf(testCSVPath, ShelfType.READING_NEXT);
            
            expect(books).toHaveLength(1);
            expect(books[0]['Exclusive Shelf']).toBe('reading-next');
        });

        it('should return empty array for shelf with no books', async () => {
            // Create CSV with no books on a specific shelf
            const emptyShelfPath = path.join(__dirname, '../fixtures/empty-shelf.csv');
            const csvContent = [
                'Title,Author,Exclusive Shelf,Bookshelves',
                '"Book 1","Author 1","read",""'
            ].join('\n');
            
            await fs.writeFile(emptyShelfPath, csvContent);
            
            try {
                const books = await GoodreadsCSVService.getBooksByShelf(emptyShelfPath, ShelfType.TO_READ);
                expect(books).toHaveLength(0);
            } finally {
                await fs.unlink(emptyShelfPath);
            }
        });
    });

    describe('getToReadBooks', () => {
        it('should get only to-read books', async () => {
            const books = await GoodreadsCSVService.getToReadBooks(testCSVPath);
            
            expect(books).toHaveLength(2);
            expect(books.every(book => book['Exclusive Shelf'] === 'to-read')).toBe(true);
        });
    });

    describe('getCurrentlyReadingBooks', () => {
        it('should get only currently-reading books', async () => {
            const books = await GoodreadsCSVService.getCurrentlyReadingBooks(testCSVPath);
            
            expect(books).toHaveLength(1);
            expect(books[0]['Exclusive Shelf']).toBe('currently-reading');
        });
    });

    describe('getReadingNextBooks', () => {
        it('should get only reading-next books', async () => {
            const books = await GoodreadsCSVService.getReadingNextBooks(testCSVPath);
            
            expect(books).toHaveLength(1);
            expect(books[0]['Exclusive Shelf']).toBe('reading-next');
        });
    });
});
