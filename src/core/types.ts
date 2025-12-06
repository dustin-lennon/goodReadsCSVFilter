export interface Book {
  Title: string;
  Author: string;
  Bookshelves: string;
  'Exclusive Shelf': string;
  [key: string]: string;
}

export interface SeriesInfo {
  seriesName: string | null;
  bookNumber?: number;
}

export interface ActiveSeries {
  seriesName: string;
  author: string;
  currentBook: string;
  currentBookNumber: number;
  normalizedAuthor: string;
}

export interface ToReadSeries {
  seriesName: string;
  author: string;
  bookCount: number;
  books: Book[];
  normalizedAuthor: string;
}

export enum ShelfType {
  TO_READ = 'to-read',
  CURRENTLY_READING = 'currently-reading',
  READING_NEXT = 'reading-next',
  READ = 'read',
}

export interface WeightedBook {
  book: Book;
  weight: number;
  reason: string;
}
