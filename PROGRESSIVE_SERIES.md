# Progressive Series Feature

## Overview

The Progressive Series feature handles special reading order requirements for light novel series where a "Progressive" retelling must be read before the main series. This is common in Japanese light novels, particularly with series like Sword Art Online.

## Problem Statement

Some light novel series have two related but separate series:
- A "Progressive" series (e.g., "Sword Art Online: Progressive Light Novel #1-9")
- A main series (e.g., "Sword Art Online Light Novel #1-28")

The Progressive series is a more detailed retelling that should be read FIRST, even though the main series numbering restarts at #1.

## Solution

The system now detects Progressive series relationships and ensures proper reading order:

### 1. Progressive Series Detection

**SeriesDetector.detectProgressiveSeries()**
- Detects series names ending with ": Progressive"
- Extracts the base series name
- Example: "Sword Art Online: Progressive" → base series is "Sword Art Online"

**SeriesDetector.isBaseSeriesForProgressive()**
- Checks if a series is the base series for a Progressive variant
- Enables linking between Progressive and main series

### 2. Active Series Tracking

**ActiveSeriesService.isNextInActiveSeriesWithProgressive()**
- Enhanced version of series continuation detection
- Checks if Progressive series exists and must be completed first
- Only shows main series books after Progressive series is complete
- For book #1 of main series: only shows if Progressive series is complete

### 3. Reading Order Logic

The system follows these rules:

1. **Progressive Series Active**: If you're reading Progressive books, only show next Progressive book
2. **Progressive Series Complete**: After finishing all Progressive books, show book #1 of main series
3. **Main Series Active**: Once started on main series, show next main series book
4. **No Progressive Series**: If no Progressive variant exists, treat as normal series

## Implementation Details

### Files Modified

- `src/core/SeriesDetector.ts`: Added Progressive detection methods
- `src/services/ActiveSeriesService.ts`: Added Progressive-aware continuation logic
- `src/services/GoodreadsCSVService.ts`: Added getAllBooks() helper method
- `tests/unit/SeriesDetector.test.ts`: Added comprehensive tests for Progressive detection

### Key Methods

```typescript
// Detect if a series is Progressive
SeriesDetector.detectProgressiveSeries(seriesName: string): {
  isProgressive: boolean;
  baseSeries: string | null;
}

// Check if series is base for Progressive variant
SeriesDetector.isBaseSeriesForProgressive(
  seriesName: string,
  progressiveSeriesName: string
): boolean

// Progressive-aware next book detection
ActiveSeriesService.isNextInActiveSeriesWithProgressive(
  book: Book,
  activeSeries: ActiveSeries[],
  csvFilePath: string
): Promise<boolean>
```

## Example: Sword Art Online

### CSV Data Structure
```
Title: Sword Art Online: Progressive Light Novel #1
Title: Sword Art Online: Progressive Light Novel #2
...
Title: Sword Art Online: Progressive Light Novel #9
Title: Sword Art Online Light Novel #1
Title: Sword Art Online Light Novel #2
...
Title: Sword Art Online Light Novel #28
```

### Reading Order Enforced
1. Read Progressive #1-9 first
2. Only after Progressive is complete, show SAO #1
3. Continue with SAO #2, #3, etc.

## Curated Reading Sheet

The Curated Reading sheet respects Progressive series relationships:
- Shows Progressive #1 if starting the series
- Shows next Progressive book if actively reading Progressive
- Shows main series #1 only after Progressive is complete
- Shows next main series book if actively reading main series

## Testing

Added 8 new tests covering:
- Progressive series detection (case-insensitive)
- Base series identification
- Edge cases (Progressive in wrong position, non-Progressive series)

All 54 tests pass, including the new Progressive series tests.

## Future Enhancements

Potential improvements:
- Support for other continuation patterns (e.g., "Prequel", "Side Story")
- Configuration file for custom series relationships
- UI indicator showing Progressive series requirements
- Automatic detection of series relationships from metadata
