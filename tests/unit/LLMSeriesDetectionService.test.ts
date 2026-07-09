import { LLMSeriesDetectionService } from '../../src/services/LLMSeriesDetectionService';

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    _mockCreate: mockCreate,
  };
});

jest.mock('../../src/services/AppSettingsService', () => ({
  AppSettingsService: {
    hasAnthropicApiKey: jest.fn().mockReturnValue(true),
    getAnthropicApiKey: jest.fn().mockReturnValue('test-key'),
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Access the mocked create fn
function getMockCreate(): jest.Mock {
  const mod = require('@anthropic-ai/sdk');
  return mod._mockCreate as jest.Mock;
}

function makeApiResponse(seriesName: string | null, bookNumber: number | null) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ seriesName, bookNumber }) }],
  };
}

describe('LLMSeriesDetectionService', () => {
  beforeEach(() => {
    // Reset in-memory cache between tests
    (LLMSeriesDetectionService as unknown as { cache: null }).cache = null;
    getMockCreate().mockReset();
  });

  describe('cacheKey', () => {
    it('includes author in key', () => {
      expect(LLMSeriesDetectionService.cacheKey('The Goodbye Man', 'Jeffery Deaver')).toBe(
        'The Goodbye Man|jeffery deaver',
      );
    });

    it('normalizes author — strips periods, lowercases', () => {
      expect(LLMSeriesDetectionService.cacheKey('The Rules of Magic', 'Alice Hoffman')).toBe(
        'The Rules of Magic|alice hoffman',
      );
      // Period-stripped variant of an author like "E. Lockhart"
      expect(LLMSeriesDetectionService.cacheKey('We Were Liars', 'E. Lockhart')).toBe(
        'We Were Liars|e lockhart',
      );
      expect(LLMSeriesDetectionService.cacheKey('We Were Liars', 'E Lockhart')).toBe(
        'We Were Liars|e lockhart',
      );
    });

    it('produces empty-author key when author omitted', () => {
      expect(LLMSeriesDetectionService.cacheKey('Some Book')).toBe('Some Book|');
    });

    it('same title, different authors → different keys', () => {
      const keyA = LLMSeriesDetectionService.cacheKey('The Never Game', 'Jeffery Deaver');
      const keyB = LLMSeriesDetectionService.cacheKey('The Never Game', 'Someone Else');
      expect(keyA).not.toBe(keyB);
    });
  });

  describe('extractSeriesInfo', () => {
    it('calls API with author in prompt and caches result', async () => {
      getMockCreate().mockResolvedValueOnce(makeApiResponse('Colter Shaw', 2));

      const result = await LLMSeriesDetectionService.extractSeriesInfo(
        'The Goodbye Man',
        'Jeffery Deaver',
      );

      expect(result.seriesName).toBe('Colter Shaw');
      expect(result.bookNumber).toBe(2);
      expect(getMockCreate()).toHaveBeenCalledTimes(1);

      // Calling again hits cache — no second API call
      const cached = await LLMSeriesDetectionService.extractSeriesInfo(
        'The Goodbye Man',
        'Jeffery Deaver',
      );
      expect(cached.seriesName).toBe('Colter Shaw');
      expect(getMockCreate()).toHaveBeenCalledTimes(1);
    });

    it('stale title-only null does not suppress author-keyed query', async () => {
      // Simulate old-format null entry sitting in cache under title-only key
      const cache = new Map<string, { seriesName: string | null; bookNumber: number | undefined }>([
        ['The Goodbye Man|', { seriesName: null, bookNumber: undefined }],
      ]);
      (LLMSeriesDetectionService as unknown as { cache: typeof cache }).cache = cache;

      getMockCreate().mockResolvedValueOnce(makeApiResponse('Colter Shaw', 2));

      // Query with author — key is "The Goodbye Man|jeffery deaver", NOT "The Goodbye Man|"
      const result = await LLMSeriesDetectionService.extractSeriesInfo(
        'The Goodbye Man',
        'Jeffery Deaver',
      );

      expect(result.seriesName).toBe('Colter Shaw');
      expect(getMockCreate()).toHaveBeenCalledTimes(1);
    });
  });

  describe('enrichMissingSeriesInfo', () => {
    it('skips titles already cached with matching author key', async () => {
      getMockCreate().mockResolvedValueOnce(makeApiResponse('Colter Shaw', 1));

      // First call populates cache
      await LLMSeriesDetectionService.extractSeriesInfo('The Never Game', 'Jeffery Deaver');

      // Second call via batch should not hit API again
      const results = await LLMSeriesDetectionService.enrichMissingSeriesInfo([
        { title: 'The Never Game', author: 'Jeffery Deaver' },
      ]);

      expect(getMockCreate()).toHaveBeenCalledTimes(1);
      expect(results.get('The Never Game')?.seriesName).toBe('Colter Shaw');
    });

    it('re-queries if only title-only null is cached (author now available)', async () => {
      // Old null entry under title-only key
      const cache = new Map<string, { seriesName: string | null; bookNumber: number | undefined }>([
        ['The Goodbye Man|', { seriesName: null, bookNumber: undefined }],
      ]);
      (LLMSeriesDetectionService as unknown as { cache: typeof cache }).cache = cache;

      getMockCreate().mockResolvedValueOnce(makeApiResponse('Colter Shaw', 2));

      const results = await LLMSeriesDetectionService.enrichMissingSeriesInfo([
        { title: 'The Goodbye Man', author: 'Jeffery Deaver' },
      ]);

      expect(getMockCreate()).toHaveBeenCalledTimes(1);
      expect(results.get('The Goodbye Man')?.seriesName).toBe('Colter Shaw');
    });
  });
});
