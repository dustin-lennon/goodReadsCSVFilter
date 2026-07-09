import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SeriesInfo } from '../core/types';
import { AppSettingsService } from './AppSettingsService';
import { SeriesDetector } from '../core/SeriesDetector';
import { getWritablePath } from '../utils/pathResolver';

const CACHE_FILE = getWritablePath('llm-series-cache.json');

type CacheEntry = { seriesName: string | null; bookNumber: number | undefined };

export class LLMSeriesDetectionService {
  private static cache: Map<string, CacheEntry> | null = null;

  // Cache key includes author so stale null entries from author-less queries
  // don't suppress re-queries that now include author context.
  static cacheKey(title: string, author?: string): string {
    const normalizedAuthor = author ? SeriesDetector.normalizeAuthor(author) : '';
    return `${title}|${normalizedAuthor}`;
  }

  private static loadCache(): Map<string, CacheEntry> {
    if (this.cache) return this.cache;

    if (existsSync(CACHE_FILE)) {
      try {
        const raw = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
        this.cache = new Map(Object.entries(raw));
        return this.cache;
      } catch {
        // Corrupt cache — reset
      }
    }

    this.cache = new Map();
    return this.cache;
  }

  private static persistCache(): void {
    if (!this.cache) return;
    const obj: Record<string, CacheEntry> = {};
    this.cache.forEach((v, k) => (obj[k] = v));
    writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  }

  static isAvailable(): boolean {
    return AppSettingsService.hasAnthropicApiKey();
  }

  /**
   * Ask Claude to extract series name and book number from a title.
   * Result is cached persistently — each title only calls the API once.
   */
  static async extractSeriesInfo(title: string, author?: string): Promise<SeriesInfo> {
    const cache = this.loadCache();
    const key = this.cacheKey(title, author);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const apiKey = AppSettingsService.getAnthropicApiKey();
    if (!apiKey) {
      return { seriesName: null, bookNumber: undefined };
    }

    const client = new Anthropic({ apiKey });

    const authorLine = author ? `Author: "${author}"\n` : '';

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        system:
          'You extract book series information from titles. Respond ONLY with valid JSON. No explanation.',
        messages: [
          {
            role: 'user',
            content: `What series is this book part of, and what is its number in the series?
Title: "${title}"
${authorLine}
Respond with JSON only:
{"seriesName": string or null, "bookNumber": number or null}

If it is not part of a series, use null for both. Book number can be decimal (e.g. 0.5).`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
      const parsed = JSON.parse(text);
      const result: CacheEntry = {
        seriesName: parsed.seriesName ?? null,
        bookNumber: parsed.bookNumber ?? undefined,
      };

      cache.set(key, result);
      this.persistCache();
      return result;
    } catch {
      const fallback: CacheEntry = { seriesName: null, bookNumber: undefined };
      cache.set(key, fallback);
      this.persistCache();
      return fallback;
    }
  }

  /**
   * Batch-process a list of books, returning only the ones with newly-detected series info.
   * Skips titles already in cache or that already have series info from regex.
   */
  static async enrichMissingSeriesInfo(
    booksWithNoInfo: { title: string; author: string }[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Map<string, SeriesInfo>> {
    const results = new Map<string, SeriesInfo>();
    const uncached = booksWithNoInfo.filter(
      (b) => !this.loadCache().has(this.cacheKey(b.title, b.author)),
    );

    for (let i = 0; i < uncached.length; i++) {
      const { title, author } = uncached[i];
      const info = await this.extractSeriesInfo(title, author);
      if (info.seriesName) results.set(title, info);
      onProgress?.(i + 1, uncached.length);
    }

    // Also pull from cache for already-cached entries
    for (const { title, author } of booksWithNoInfo) {
      if (!results.has(title)) {
        const cached = this.loadCache().get(this.cacheKey(title, author));
        if (cached?.seriesName) results.set(title, cached);
      }
    }

    return results;
  }
}
