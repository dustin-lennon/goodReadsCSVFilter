import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { Book, ShelfType } from '../core/types';

/**
 * Service for reading and filtering Goodreads CSV data
 */
export class GoodreadsCSVService {
  /**
   * Read all books from CSV file
   */
  static async readAllBooks(filePath: string): Promise<Book[]> {
    return new Promise((resolve, reject) => {
      const records: Book[] = [];

      const stream = createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row: Book) => {
          records.push(row);
        })
        .on('end', () => {
          stream.destroy();
          resolve(records);
        })
        .on('error', (error) => {
          stream.destroy();
          reject(error);
        });
    });
  }

  /**
   * Get books from a specific shelf
   */
  static async getBooksByShelf(filePath: string, shelfType: ShelfType): Promise<Book[]> {
    return new Promise((resolve, reject) => {
      const records: Book[] = [];

      const stream = createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row: Book) => {
          const shelf = row['Exclusive Shelf']?.trim().toLowerCase();
          if (shelf === shelfType) {
            records.push(row);
          }
        })
        .on('end', () => {
          stream.destroy();
          resolve(records);
        })
        .on('error', (error) => {
          stream.destroy();
          reject(error);
        });
    });
  }

  /**
   * Get books from to-read shelf
   */
  static async getToReadBooks(filePath: string): Promise<Book[]> {
    return this.getBooksByShelf(filePath, ShelfType.TO_READ);
  }

  /**
   * Get books from currently-reading shelf
   */
  static async getCurrentlyReadingBooks(filePath: string): Promise<Book[]> {
    return this.getBooksByShelf(filePath, ShelfType.CURRENTLY_READING);
  }

  /**
   * Get books from reading-next shelf
   */
  static async getReadingNextBooks(filePath: string): Promise<Book[]> {
    return this.getBooksByShelf(filePath, ShelfType.READING_NEXT);
  }

  /**
   * Get books from read shelf
   */
  static async getReadBooks(filePath: string): Promise<Book[]> {
    return this.getBooksByShelf(filePath, ShelfType.READ);
  }

  /**
   * Get all books (alias for readAllBooks)
   */
  static async getAllBooks(filePath: string): Promise<Book[]> {
    return this.readAllBooks(filePath);
  }
}
