import { SeriesDetector } from '../../src/core/SeriesDetector';

describe('SeriesDetector', () => {
  describe('extractSeriesInfo', () => {
    it('should extract series info from format: Book Title (Series Name, #1)', () => {
      const result = SeriesDetector.extractSeriesInfo('Cross Fire (Alex Cross, #17)');

      expect(result.seriesName).toBe('Alex Cross');
      expect(result.bookNumber).toBe(17);
    });

    it('should extract series info from format: Book Title (Series Name #1)', () => {
      const result = SeriesDetector.extractSeriesInfo('The Hunger Games (The Hunger Games #1)');

      expect(result.seriesName).toBe('The Hunger Games');
      expect(result.bookNumber).toBe(1);
    });

    it('should extract series info from format: Series Name #1', () => {
      const result = SeriesDetector.extractSeriesInfo('Alex Cross #1');

      expect(result.seriesName).toBe('Alex Cross');
      expect(result.bookNumber).toBe(1);
    });

    it('should extract series info from format: Book Title (Series Name)', () => {
      const result = SeriesDetector.extractSeriesInfo('Some Book (Cool Series)');

      expect(result.seriesName).toBe('Cool Series');
      expect(result.bookNumber).toBeUndefined();
    });

    it('should extract series info from format: Series Name: Book Title', () => {
      const result = SeriesDetector.extractSeriesInfo('Harry Potter: The Chamber of Secrets');

      expect(result.seriesName).toBe('Harry Potter');
      expect(result.bookNumber).toBeUndefined();
    });

    it('should handle decimal book numbers', () => {
      const result = SeriesDetector.extractSeriesInfo('Action (Alex Cross, #21.5)');

      expect(result.seriesName).toBe('Alex Cross');
      expect(result.bookNumber).toBe(21.5);
    });

    it('should return null for non-series books', () => {
      const result = SeriesDetector.extractSeriesInfo('Some Random Book Title');

      expect(result.seriesName).toBeNull();
      expect(result.bookNumber).toBeUndefined();
    });

    it('should reject long potential series names in parentheses', () => {
      const result = SeriesDetector.extractSeriesInfo(
        'Book Title (This is way too long to be a legitimate subtitle and not a real collection)',
      );

      expect(result.seriesName).toBeNull();
    });
  });

  describe('normalizeAuthor', () => {
    it('should normalize author names consistently', () => {
      expect(SeriesDetector.normalizeAuthor('James  Patterson')).toBe('james patterson');
      expect(SeriesDetector.normalizeAuthor('  James   Patterson  ')).toBe('james patterson');
      expect(SeriesDetector.normalizeAuthor('JAMES PATTERSON')).toBe('james patterson');
    });
  });
});

describe('detectProgressiveSeries', () => {
  it('should detect Progressive series and extract base series name', () => {
    const result = SeriesDetector.detectProgressiveSeries('Sword Art Online: Progressive');

    expect(result.isProgressive).toBe(true);
    expect(result.baseSeries).toBe('Sword Art Online');
  });

  it('should handle case-insensitive Progressive detection', () => {
    const result = SeriesDetector.detectProgressiveSeries('Sword Art Online: PROGRESSIVE');

    expect(result.isProgressive).toBe(true);
    expect(result.baseSeries).toBe('Sword Art Online');
  });

  it('should return false for non-Progressive series', () => {
    const result = SeriesDetector.detectProgressiveSeries('Sword Art Online');

    expect(result.isProgressive).toBe(false);
    expect(result.baseSeries).toBeNull();
  });

  it('should return false for series with Progressive in the middle', () => {
    const result = SeriesDetector.detectProgressiveSeries('Progressive Sword Art Online');

    expect(result.isProgressive).toBe(false);
    expect(result.baseSeries).toBeNull();
  });

  it('should detect Progressive series with suffixes like "Light Novel"', () => {
    const result = SeriesDetector.detectProgressiveSeries(
      'Sword Art Online: Progressive Light Novel',
    );

    expect(result.isProgressive).toBe(true);
    expect(result.baseSeries).toBe('Sword Art Online');
  });
});

describe('isBaseSeriesForProgressive', () => {
  it('should identify base series for Progressive variant', () => {
    const result = SeriesDetector.isBaseSeriesForProgressive(
      'Sword Art Online',
      'Sword Art Online: Progressive',
    );

    expect(result).toBe(true);
  });

  it('should handle case-insensitive comparison', () => {
    const result = SeriesDetector.isBaseSeriesForProgressive(
      'sword art online',
      'Sword Art Online: Progressive',
    );

    expect(result).toBe(true);
  });

  it('should return false for non-matching series', () => {
    const result = SeriesDetector.isBaseSeriesForProgressive(
      'Different Series',
      'Sword Art Online: Progressive',
    );

    expect(result).toBe(false);
  });

  it('should return false when second parameter is not Progressive', () => {
    const result = SeriesDetector.isBaseSeriesForProgressive(
      'Sword Art Online',
      'Sword Art Online',
    );

    expect(result).toBe(false);
  });
});
