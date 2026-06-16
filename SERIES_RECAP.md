# Series Recap Feature

> Spec captured from a planning conversation, aligned to the existing codebase.
> Companion to `PROGRESSIVE_SERIES.md`. This is the **series-level sibling** of the
> single-book `BookChatService` — same spoiler-aware idea, spanning a whole series.

## Goal

A "catch me up" feature: given the reader's position in a series, summarize everything
that has happened **up to that point and no further** (spoiler-bounded). Use case: series
read slowly across many books (often physical), where earlier events are forgotten by the
time the reader resumes.

## Key insight

For well-known, **published** series, no book text needs to be extracted — the model knows
the plots from training. The only input is reading position, which this app already computes
from Goodreads shelves. Physical vs. ebook is irrelevant here.

## Build on what already exists (do not reinvent)

- **Position is already modeled.** `SeriesProgress` (`src/core/types.ts`), produced by
  `SeriesProgressionTimelineService`, carries `books: BookProgress[]`, `currentBookNumber`,
  `booksRead`, `completionPercentage`, and dates. That *is* the reading position — consume it
  directly rather than defining new position types.
- **Reading order is already handled.** `SeriesDetector` / `ActiveSeriesService` order books
  including Progressive-series rules. The recap must follow that order (see Ordering below).
- **The LLM call pattern is established** in `BookChatService` (single-book spoiler-aware
  summary). Mirror it exactly:
  - API key via `AppSettingsService.getAnthropicApiKey()` (Settings UI), not an env var
  - `new Anthropic({ apiKey })`
  - wrap calls in `friendlyApiError(...)`
  - static-method service class
  - `model: 'claude-sonnet-4-6'`
  - system prompt with explicit numbered spoiler rules
  - the honesty rule: if unsure of a detail, say so rather than invent

In one line: this feature is `BookChatService.startChat` generalized from one book to a
series in reading order.

## Spoiler boundary (the core constraint)

The model's default is to summarize the whole arc, so the prompt must forbid anything past
the boundary, including foreshadowing. The boundary is: books with status `READ` (in order),
plus the `CURRENTLY_READING` book up to an optional free-text progress note (mirrors
`BookChatService`'s `progress` parameter).

## Ordering (matters here)

Books must be recapped in the order the reader is following, which the app already enforces
(Progressive variants first, etc.). This is the same concern as the "Prequel/Side Story"
pattern listed under Future Enhancements in `PROGRESSIVE_SERIES.md`.

Concrete case — **Practical Magic** (Alice Hoffman): publication order is *Practical Magic,
The Rules of Magic, Magic Lessons, The Book of Magic*; chronological order is *Magic Lessons,
The Rules of Magic, Practical Magic, The Book of Magic*. The reader is doing the two prequels
first. A naive book-number recap would spoil the original novel — so pull the ordered list
from `SeriesProgress.books` (already ordered) rather than re-deriving it.

## Reliability + recency → enable web_search

- **Long series** (e.g. Alex Cross, ~35 books) are reliable for major arcs but shaky on
  fine-grained detail; the model can confabulate.
- **Newest installments** are past the model's training cutoff.

Both are mitigated by enabling the server-side web search tool in the call:

```ts
tools: [{ type: 'web_search_20250305', name: 'web_search' }]
```

This is an addition beyond the current `BookChatService` pattern. Note: with any tool enabled,
the response has multiple content blocks — collect text by filtering `type === 'text'`, not
`response.content[0]`.

## Service sketch — `src/services/SeriesRecapService.ts`

```ts
import Anthropic from '@anthropic-ai/sdk';
import { AppSettingsService } from './AppSettingsService';
import { SeriesProgress, BookProgressStatus } from '../core/types';
// NOTE: friendlyApiError currently lives inside BookChatService.ts. Lift it into a shared
// util (e.g. src/utils/anthropicErrors.ts) and import it in both services. See TODO.

export interface RecapOptions {
  /** Free-text position within the in-progress book, e.g. "chapter 12" or "just after X". */
  progressNote?: string;
  /** Ground the recap with web search — recommended for long or recent series. */
  useWebSearch?: boolean;
}

export class SeriesRecapService {
  static async generateRecap(progress: SeriesProgress, opts: RecapOptions = {}): Promise<string> {
    const apiKey = AppSettingsService.getAnthropicApiKey();
    if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings.');

    const client = new Anthropic({ apiKey });

    // SeriesProgress.books is already in reading order (Progressive/prequel-aware).
    const ordered = [...progress.books].sort((a, b) => a.bookNumber - b.bookNumber);
    const read = ordered.filter((b) => b.status === BookProgressStatus.READ);
    const current = ordered.find((b) => b.status === BookProgressStatus.CURRENTLY_READING);

    const completedList =
      read.map((b) => `#${b.bookNumber} "${b.title}"`).join('; ') || 'none yet';
    const boundary = current
      ? `partway through #${current.bookNumber} "${current.title}"` +
        (opts.progressNote ? ` (${opts.progressNote})` : '')
      : `having just finished ${read.at(-1) ? `"${read.at(-1)!.title}"` : 'the first book'}`;

    const systemPrompt = `You are catching a reader up on a book series they are reading slowly. You:
1. Summarize what has happened across the series UP TO their stated point — book by book, in the reading order given
2. Do NOT reveal or hint at anything past that point — no foreshadowing of later books or chapters
3. End with a short "where you are now" note
4. If you are not confident about a specific plot detail, say so plainly instead of inventing it${
      opts.useWebSearch ? ' — use web search to verify events and to cover recent installments' : ''
    }

Stay focused on this series only.`;

    const userMessage =
      `Series: "${progress.seriesName}" by ${progress.author}.\n` +
      `I've read, in order: ${completedList}.\n` +
      `I'm currently ${boundary}.\n` +
      `Catch me up on everything up to that point, following the order above.`;

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        ...(opts.useWebSearch
          ? { tools: [{ type: 'web_search_20250305', name: 'web_search' }] }
          : {}),
      });
    } catch (error) {
      throw friendlyApiError(error); // from shared util once extracted
    }

    // With web_search enabled the response has multiple blocks — collect all text.
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }
}
```

## CSV → position (already free)

`SeriesProgress` is derived from shelves: `READ` → completed (in order), `CURRENTLY_READING`
→ current book. So book-level position is automatic from the export the app already parses;
only the within-book progress note is manual. The known rough edge — series name often
embedded in the `Title` field rather than a clean column — is already handled by
`SeriesDetector`.

## Concrete cases to seed with

- **Alex Cross** (James Patterson) — physical copies, ~35 books, publication order. There's
  already a `src/debugAlexCross.ts` to test against. Long series → lean on `web_search`.
- **Practical Magic** (Alice Hoffman) — 4 books; exercises the prequel-ordering path described
  above (reader doing the two prequels first, on Kindle).

## TODO

- [ ] Extract `friendlyApiError` from `BookChatService.ts` into a shared util; import in both.
- [ ] Implement `SeriesRecapService.generateRecap(progress, opts)` per the sketch.
- [ ] Wire web_search and multi-block response parsing.
- [ ] Confirm recap ordering uses `SeriesProgress.books` order (Progressive/prequel-aware).
- [ ] Surface in the GUI next to the existing `BookChatService` entry point.
- [ ] Optional: cache recaps keyed on `{ seriesName, currentBookNumber, progressNote }` to
      avoid re-billing identical requests.
