import { Book } from '../../src/core/types';

export const sampleBooks: Book[] = [
  {
    Title: 'Cross Fire (Alex Cross, #17)',
    Author: 'James Patterson',
    Bookshelves: '',
    'Exclusive Shelf': 'to-read',
  },
  {
    Title: 'Alex Cross Must Die (Alex Cross, #32)',
    Author: 'James Patterson',
    Bookshelves: '',
    'Exclusive Shelf': 'to-read',
  },
  {
    Title: 'The Hunger Games (The Hunger Games, #1)',
    Author: 'Suzanne Collins',
    Bookshelves: '',
    'Exclusive Shelf': 'to-read',
  },
  {
    Title: 'Catching Fire (The Hunger Games, #2)',
    Author: 'Suzanne Collins',
    Bookshelves: '',
    'Exclusive Shelf': 'to-read',
  },
  {
    Title: 'Some Random Book',
    Author: 'Random Author',
    Bookshelves: '',
    'Exclusive Shelf': 'to-read',
  },
  {
    Title: "Witch's Dawn (Unholy Trinity #1)",
    Author: 'Crystal Ash',
    Bookshelves: '',
    'Exclusive Shelf': 'currently-reading',
  },
  {
    Title: 'The Never Game (Colter Shaw, #1)',
    Author: 'Jeffery Deaver',
    Bookshelves: '',
    'Exclusive Shelf': 'reading-next',
  },
];

export const alexCrossBooks: Book[] = Array.from({ length: 30 }, (_, i) => ({
  Title: `Alex Cross Book ${i + 1} (Alex Cross, #${i + 1})`,
  Author: 'James Patterson',
  Bookshelves: '',
  'Exclusive Shelf': 'to-read',
}));
