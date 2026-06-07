# GoodReads CSV Filter - Series Continuation Weighting

A TypeScript application that intelligently weights books from your GoodReads to-read shelf based on **series continuation analysis** and exports them to Google Sheets for use with book selection wheels.

**Available in two versions:**
- 📟 **CLI Version**: Fast command-line interface for power users
- 🖥️ **GUI Version**: Beautiful desktop application with visual progress tracking

## Features

- 🧠 **Active Series Detection**: Automatically detects which series you're currently reading or planning to read next
- ⚖️ **Smart Continuation Weighting**: Prioritizes the **next book** in active series with 5x weight
- � **Curated Reading Sheet**: Separate sheet with only first books, next-in-series, and standalone books (no middle books)
- 🎌 **Progressive Series Support**: Handles light novel series where "Progressive" retelling must be read before main series (e.g., Sword Art Online)
- 📊 **Google Sheets Integration**: Exports weighted book lists for spinner wheels
- 🔄 **Multi-Shelf Analysis**: Analyzes to-read → currently-reading → reading-next → read for intelligent prioritization
- ✅ **Test Driven Development**: 100% coverage on core business logic with 54 comprehensive tests

## How It Works

### Series Continuation Logic

Unlike traditional systems that weight ALL books in large series, this system identifies **which series you're actively engaged with** and weights only the **next sequential book**:

1. **Active Series Detection**: Scans your `currently-reading`, `reading-next`, and recent `read` books (last 2 years)
2. **Next Book Identification**: Finds books in `to-read` that are the next sequential books in active series
3. **Intelligent Weighting**: Applies 5x weight to continuation books, 1x weight to everything else

### Example Scenario

```
Currently Reading: "Witch's Dawn (Unholy Trinity, #1)" by Crystal Ash
Recently Read: "Cross Fire (Alex Cross, #17)" by James Patterson (read 6 months ago)
To-Read Shelf: Contains "Witch's Twilight (Unholy Trinity, #2)" + "Violets Are Blue (Alex Cross, #18)" + 50 other books

Result: "Witch's Twilight #2" gets 5x weight (next in active series)
        "Violets Are Blue #18" gets 5x weight (next in recently completed series)
        All other books get 1x weight (standard priority)
```

### Curated Reading Sheet

The system creates a second Google Sheet called "Curated Reading" that filters your to-read list to show only:
- **First books** in any series (book #1) - great starting points
- **Next books** in active series - books you're ready to continue
- **Standalone books** - all non-series books

This eliminates clutter from middle books in series you haven't started yet, making it easier to pick your next read.

### Progressive Series Support

For light novel series (like Sword Art Online), the system recognizes when a "Progressive" retelling must be read before the main series:

```
Series Structure:
- Sword Art Online: Progressive #1-9 (detailed retelling)
- Sword Art Online #1-28 (main series)

Reading Order Enforced:
1. Read Progressive #1-9 first
2. Only after Progressive is complete, show SAO #1
3. Continue with SAO #2, #3, etc.
```

The system automatically detects ": Progressive" in series names and ensures proper reading order. See [PROGRESSIVE_SERIES.md](./PROGRESSIVE_SERIES.md) for technical details.

## Key Benefits

### 🎯 **Smart Series Progression**
- Only weighs books you're **ready to read next**, not entire series collections
- Prevents your wheel from being dominated by prolific authors with 30+ book series
- Focuses on **reading continuity** rather than **series popularity**

### 🧠 **Context-Aware Intelligence**  
- Analyzes your **current reading state** from multiple shelves (currently-reading, reading-next, recent reads)
- Understands the difference between "planning to start" vs "continuing a series"
- Detects recently completed series to maintain reading momentum
- Adapts to your reading habits automatically

### ⚖️ **Balanced Selection**
- High-priority books get 5x weight (strong preference without total domination)
- All other books maintain equal 1x weight (fair representation)
- Results in meaningful variety while respecting series momentum

## Project Structure

```
src/
├── core/                   # Core domain logic
│   ├── types.ts           # Type definitions
│   ├── SeriesDetector.ts  # Series pattern detection & Progressive series handling
│   └── BookWeightingApp.ts # Main application orchestrator
├── services/              # Business logic services
│   ├── GoodreadsCSVService.ts    # CSV reading and filtering
│   ├── ActiveSeriesService.ts    # Active series detection & Progressive logic
│   ├── BookWeightingService.ts   # Series continuation weighting
│   ├── ToReadSeriesService.ts    # To-read series analysis
│   ├── SeriesProgressionTimelineService.ts  # Series progression tracking
│   └── GoogleSheetsService.ts    # Google Sheets integration & Curated Reading sheet
├── utils/                 # Utility functions
├── gui/                   # File dialog components
│   ├── fileDialog.ts
│   └── launchFileDialog.ts
├── auth.ts               # Google OAuth authentication
└── cli.ts                # Main CLI entry point

tests/
├── unit/                 # Unit tests for core components
├── integration/          # Integration tests
└── fixtures/             # Test data fixtures
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Google Cloud Project with Sheets API enabled

### Installation

```bash
# Install dependencies
pnpm install
```

### Quick Start

**CLI Version (Terminal):**
```bash
# Run the command-line version
pnpm start
```

**GUI Version (Desktop App):**
```bash
# Run the graphical interface
pnpm run start:gui
```

**Executable Version:**
```bash
# Create a standalone executable
pnpm run build:executable
```

> 📖 **See [USAGE.md](./USAGE.md) for detailed instructions on all three options**

> ⚠️ **macOS: "App is damaged and can't be opened"**
> The released `.dmg` is not code-signed/notarized (no Apple Developer ID), so macOS
> Gatekeeper quarantines it after download and shows this misleading message. To fix,
> after copying the app to `/Applications`, run:
> ```bash
> xattr -cr "/Applications/GoodReads Book Weighting System.app"
> ```
> Then open the app normally (or right-click → Open on first launch).

> ⚠️ **Windows: "Windows protected your PC"**
> The released `.exe` installer is not code-signed (no code-signing certificate), so
> Windows SmartScreen flags it as from an "Unknown publisher." Click **More info** →
> **Run anyway** to proceed with installation.

> ℹ️ **AI Book Chat requires your own Anthropic API key**
> The Book Chat feature calls the Anthropic API directly from your machine — it is
> **not** bundled with or proxied through the app. Get your own key at
> [console.anthropic.com](https://console.anthropic.com/) and add it via the in-app
> **Settings** modal. Usage is billed to your own Anthropic account.

### Setup

1. **Google Sheets API Setup**:
   - Create a Google Cloud Project
   - Enable the Google Sheets API
   - Create OAuth 2.0 credentials
   - Download and save as `client_secret.json`

2. **First Run**:
   - Run `pnpm start`
   - Complete OAuth flow in browser
   - Select your GoodReads CSV export file

## How It Works

### Series Detection

The system uses sophisticated pattern matching to detect book series:

```typescript
// Patterns supported:
"Cross Fire (Alex Cross, #17)"     → Alex Cross series, book 17
"The Hunger Games (The Hunger Games, #1)" → Hunger Games series, book 1  
"Harry Potter: Chamber of Secrets" → Harry Potter series
"Book Title (Series Name)"         → Series Name series
```

### Weighting Algorithm

Books receive weights based on series continuation analysis:

```typescript
// Active Series Detection
const activeSeries = await ActiveSeriesService.detectActiveSeries(csvFilePath);
// Finds series from currently-reading, reading-next, and recent read books (last 2 years)

// Continuation Weighting
for (const book of toReadBooks) {
    if (ActiveSeriesService.isNextInActiveSeries(book, activeSeries)) {
        weight = 5;  // Next book in active series gets priority
        reason = `Next book in ${seriesName} series (currently on book ${currentNumber})`;
    } else {
        weight = 1;  // Standard weight for all other books
        reason = 'Standard weight';
    }
}
```

### Workflow Integration

- **to-read**: Your main book list (gets continuation weighting analysis)
- **currently-reading**: Books you're actively reading (used to detect active series)
- **reading-next**: Books queued up next (also used to detect active series)
- **read**: Recently completed books (last 2 years - used to detect recently finished series)

## Testing & Code Coverage Results

This project uses Jest for unit and integration testing, following Test Driven Development principles.

- **Total tests:** 54
- **Test suites:** 7
- **Coverage summary:**
  - **Statements:** 60%+
  - **Branches:** 68%+
  - **Functions:** 69%+
  - **Lines:** 61%+
- **Core business logic:** 100% coverage
- **Active Series Logic:** 91%+ coverage
- **CSV Processing:** 84%+ coverage
- **Progressive Series Detection:** 100% coverage

### How to Run Tests & View Coverage

```bash
# Run all tests
pnpm test

# View coverage report
pnpm test:coverage
```

The coverage report is generated in the `coverage/` directory after running the coverage command.

### Development Commands

```bash
# Run tests in watch mode
pnpm test:watch

# Build the project
pnpm build

# Type checking
pnpm run lint
```

### Test Coverage Summary

- ✅ **Core Domain**: 100% coverage (BookWeightingApp, SeriesDetector, types)
- ✅ **Active Series Logic**: 91.3% coverage (ActiveSeriesService) 
- ✅ **Weighting Logic**: 100% coverage (BookWeightingService)
- ✅ **CSV Processing**: 84% coverage (GoodreadsCSVService)
- ✅ **Integration Tests**: End-to-end workflow validation

### Test Structure

- **Unit Tests**: Test individual components in isolation (46 tests)
- **Integration Tests**: Test complete workflows end-to-end (8 tests)
- **Fixtures**: Reusable test data for consistent testing
- **Progressive Series Tests**: Comprehensive coverage of Progressive series detection and handling

## Google Sheets Output

The application creates a Google Sheet with two tabs:

### Sheet1 (Main Weighted List)
Contains all your to-read books with weights applied:
- **Book Title by Author**: Full book information
- **Bookshelves**: Your GoodReads shelf tags
- **Weight**: Numerical weight (5 for continuations, 1 for others)
- **Reason**: Explanation of why the weight was applied

### Curated Reading Sheet
A filtered view showing only books you're ready to read:
- **Book Title by Author**: Full book information
- **Series Name**: The series this book belongs to (if any)
- **Book Number**: Position in the series
- **Type**: Classification (Standalone, First Book, Next in Series)
- **Weight**: Numerical weight
- **Reason**: Explanation of the weight

This sheet is perfect for decision-making as it excludes middle books from series you haven't started yet.

## Example Output

```
📚 GoodReads Book Weighting System
=====================================

📂 Please select your Goodreads CSV file...
📖 Reading to-read books...
   Found 89 books on your to-read shelf

🧠 Analyzing active series and applying weights...
🧠 Found 3 active series:
   📖 Unholy Trinity by Crystal Ash (currently on book 1)
   📖 Colter Shaw by Jeffery Deaver (currently on book 1)
   📖 Alex Cross by James Patterson (recently completed book 17)

🎯 High-priority books (series continuations):
   📖 Witch's Twilight (Unholy Trinity, #2) by Crystal Ash (5x)
      Reason: Next book in Unholy Trinity series (currently on book 1)
   
   📖 The Final Twist (Colter Shaw, #2) by Jeffery Deaver (5x)
      Reason: Next book in Colter Shaw series (currently on book 1)
      
   📖 Violets Are Blue (Alex Cross, #18) by James Patterson (5x)
      Reason: Next book in Alex Cross series (recently completed book 17)

📤 Exporting to Google Sheets...

📊 Weight distribution:
   5x weight: 3 books
   1x weight: 86 books

📚 Created Curated Reading sheet with 45 books:
   📖 Standalone books: 30
   📚 First books in series: 12
   ➡️  Next books in active series: 3

✅ Sync complete!
📄 Summary:
  • Books exported: 89
  • High-priority books: 3
  • Curated reading list: 45 books
  • Google Sheet: https://docs.google.com/spreadsheets/d/abc123
  
🎯 Your book selection wheel now prioritizes series continuations!
```

## Architecture Decisions

### Series Continuation vs Collection Size

**Key Innovation**: This system weights the **next book** in active series rather than **all books** in large series.

**Why This Matters**:
- ❌ **Old Approach**: "Weight all 30+ Alex Cross books because it's a big series"
- ✅ **New Approach**: "Weight only Alex Cross #18 because I'm currently reading #17"

This ensures your book wheel prioritizes **series progression** over **series popularity**.

### Progressive Series Handling

**Challenge**: Light novel series often have "Progressive" retellings that must be read before the main series, even though numbering restarts.

**Solution**: The system detects ": Progressive" in series names and enforces reading order:
1. Detects Progressive series relationships (e.g., "SAO: Progressive" → "SAO")
2. Blocks main series books until Progressive series is complete
3. Automatically shows next Progressive book when actively reading
4. Transitions to main series #1 only after Progressive is finished

This prevents reading books out of order and maintains story continuity for complex light novel series.

### Curated Reading Sheet

**Problem**: Large to-read lists with many series can be overwhelming, especially when they include middle books from series you haven't started.

**Solution**: A separate sheet that filters to show only:
- Books you can start right now (first books, standalones)
- Books you're ready to continue (next in active series)

This reduces decision fatigue and makes book selection more enjoyable.

### Test Driven Development

- **Red-Green-Refactor**: Write failing tests first, implement minimal code to pass, then refactor
- **Single Responsibility**: Each class/function has one clear purpose
- **Dependency Injection**: Services can be easily mocked for testing
- **Pure Functions**: Core logic is side-effect free for predictable testing

### Clean Architecture

- **Core Domain**: Business logic isolated from external dependencies
- **Services**: Orchestrate domain logic with external systems  
- **Adapters**: Handle integration with Google Sheets, file system, etc.
- **Boundaries**: Clear separation between layers

## Contributing

1. Write tests first (TDD approach)
2. Ensure all tests pass: `pnpm test`
3. Check TypeScript compilation: `pnpm lint`
4. Follow existing code structure and naming conventions
