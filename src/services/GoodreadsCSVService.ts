import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { Book, ShelfType } from '../core/types';

/**
 * Service for reading and filtering Goodreads CSV data
 */
export class GoodreadsCSVService {
  private static cache = new Map<string, Book[]>();

  /** Clear cached books. Call with no args to clear all, or pass a path to clear one entry. */
  static clearCache(filePath?: string): void {
    if (filePath) {
      this.cache.delete(filePath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Read all books from CSV file. Result is cached per file path for the lifetime of the process.
   */
  static async readAllBooks(filePath: string): Promise<Book[]> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    return new Promise((resolve, reject) => {
      const records: Book[] = [];

      const stream = createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row: Book) => {
          records.push(row);
        })
        .on('end', () => {
          stream.destroy();
          this.cache.set(filePath, records);
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
    const books = await this.readAllBooks(filePath);
    return books.filter((row) => row['Exclusive Shelf']?.trim().toLowerCase() === shelfType);
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
