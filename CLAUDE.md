# GoodReads CSV Filter — Claude Code Context

## Project Overview

TypeScript Electron/CLI app that weights GoodReads to-read books based on series continuation analysis, then exports to Google Sheets for a book selection wheel.

**Current version:** 1.3.9  
**Package manager:** pnpm  
**Runtime:** Node 18+, Electron (GUI mode)

## Architecture

```
src/core/           — Domain types + pure business logic (no side effects)
  types.ts          — All shared interfaces/enums (Book, SeriesInfo, WeightedBook, etc.)
  SeriesDetector.ts — Series pattern matching + Progressive series handling
  BookWeightingApp.ts — Main orchestrator (CLI + GUI variants)

src/services/       — Business logic with external I/O
  GoodreadsCSVService.ts         — CSV parsing, shelf filtering
  ActiveSeriesService.ts         — Active series detection + Progressive logic
  BookWeightingService.ts        — 5x/1x weighting algorithm
  GoogleSheetsService.ts         — OAuth, sheet create/write, Curated Reading sheet
  SeriesProgressionTimelineService.ts — Timeline generation

src/gui/            — Electron GUI components
src/utils/          — errorHandler, pathResolver, timelineFormatter
src/auth.ts         — Google OAuth flow
src/cli.ts          — CLI entry point

tests/
  unit/             — Per-service unit tests
  integration/      — End-to-end flow tests
  fixtures/         — Shared test data (sampleData.ts/.js)
```

## Key Domain Concepts

- **Active series**: series from currently-reading, reading-next, or read within last 2 years
- **5x weight**: next sequential book in an active series
- **1x weight**: everything else
- **Curated Reading sheet**: only first books, next-in-series, and standalones (no mid-series clutter)
- **Progressive series**: "SAO: Progressive" must be finished before main "SAO" series unlocks

## Development Commands

```bash
pnpm test              # run all tests
pnpm test:coverage     # coverage report → coverage/
pnpm test:watch        # watch mode
pnpm build             # tsc compile
pnpm run typecheck     # tsc --noEmit (no emit)
pnpm run lint          # eslint src/ tests/
pnpm start             # CLI (builds dialog + runs ts-node src/cli.ts)
pnpm run start:gui     # Electron GUI
pnpm run build:executable  # standalone binary
```

## Testing Conventions

- Jest with ts-jest; both `.ts` and compiled `.js` test files exist — edit only `.ts`
- TDD: write failing test first, then implement
- Unit tests mock external services (Google Sheets, file system)
- Fixtures live in `tests/fixtures/sampleData.ts`
- Core business logic target: 100% coverage

## Code Conventions

- Pure functions in `src/core/` — no side effects, easy to test
- Static class methods throughout (e.g., `BookWeightingService.applyWeights(...)`)
- `progressCallback?: (message: string) => void` pattern for GUI progress reporting
- No default exports — named exports only
- Semantic versioning via `semantic-release` + conventional commits
- Husky pre-commit hooks enforce commitlint

## External Dependencies

- `client_secret.json` — Google OAuth credentials (gitignored, must exist to run)
- `token.json` — OAuth token cached after first auth (writable path logic in pathResolver.ts)
- `sheet-id.txt` — persisted Google Sheet ID

## Git Workflow — MANDATORY

Every change goes through a PR. No exceptions, including small fixes.

```bash
# 1. Create issue
gh issue create --title "..." --label "bug"

# 2. Create + checkout branch from issue
gh issue develop <N> --checkout

# 3. Verify branch before EVERY commit
git branch --show-current   # must NOT be main or dev

# 4. Commit, push, open PR
git push -u origin <branch>
gh pr create --base main
```

**Never commit directly to `main` or `dev`.** If accidentally on main, stash changes and create a branch first.

## What NOT to do

- Don't commit directly to `main` or `dev` — always use a feature branch + PR
- Don't edit `.js` test/fixture files directly — they're compiled outputs; edit `.ts` sources
- Don't skip husky hooks (`--no-verify`) — fix the underlying lint/commit-format issue
- Don't add weights beyond 5x/1x without updating `BookWeightingService` tests
- Don't mock Google Sheets in integration tests — use real fixtures that simulate the data shape
