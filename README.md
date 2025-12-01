# GoodReads CSV Filter - Series Continuation Weighting

A TypeScript application that intelligently weights books from your GoodReads to-read shelf based on **series continuation analysis** and exports them to Google Sheets for use with book selection wheels.

**Available in two versions:**
- 📟 **CLI Version**: Fast command-line interface for power users
- 🖥️ **GUI Version**: Beautiful desktop application with visual progress tracking

## Features

- 🧠 **Active Series Detection**: Automatically detects which series you're currently reading or planning to read next
- ⚖️ **Smart Continuation Weighting**: Prioritizes the **next book** in active series with 5x weight
- 📊 **Google Sheets Integration**: Exports weighted book lists for spinner wheels
- 🔄 **Multi-Shelf Analysis**: Analyzes to-read → currently-reading → reading-next → read for intelligent prioritization
- ✅ **Test Driven Development**: 100% coverage on core business logic with 34 comprehensive tests

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
│   ├── SeriesDetector.ts  # Series pattern detection
│   └── BookWeightingApp.ts # Main application orchestrator
├── services/              # Business logic services
│   ├── GoodreadsCSVService.ts    # CSV reading and filtering
│   ├── ActiveSeriesService.ts    # Active series detection
│   ├── ToReadSeriesService.ts    # Series continuation weighting (BookWeightingService)
│   └── GoogleSheetsService.ts    # Google Sheets integration
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

- **Total tests:** 36
- **Test suites:** 6
- **Coverage summary:**
  - **Statements:** 59.91%
  - **Branches:** 67.74%
  - **Functions:** 68.88%
  - **Lines:** 60.74%
- **Core business logic:** 100% coverage
- **Active Series Logic:** 91.3% coverage
- **CSV Processing:** 84% coverage

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

- **Unit Tests**: Test individual components in isolation (30 tests)
- **Integration Tests**: Test complete workflows end-to-end (6 tests)
- **Fixtures**: Reusable test data for consistent testing

## Example Output

```
📚 GoodReads Book Weighting System
=====================================

� Please select your Goodreads CSV file...
�📖 Reading to-read books...
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

✅ Sync complete!
📄 Summary:
  • Books exported: 89
  • High-priority books: 3
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
