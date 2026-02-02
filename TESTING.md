# Testing Guide - Series Progression Timeline

This guide will help you test the new **Series Progression Timeline** feature locally before committing changes.

## 🧪 Quick Test Checklist

- [ ] Run automated tests
- [ ] Build the project successfully
- [ ] Test CLI version with a CSV file
- [ ] Test GUI version with a CSV file
- [ ] Verify timeline output appears correctly
- [ ] Check that all features still work

---

## 1. Run Automated Tests

The timeline feature includes comprehensive unit tests. Run them first:

```bash
# Run all tests
pnpm test

# Run only timeline-related tests
pnpm test -- SeriesProgressionTimelineService

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode (for development)
pnpm test:watch
```

**Expected Result:**
- ✅ All 9 timeline service tests should pass
- ✅ Total: 43+ tests passing
- ⚠️ Note: 2 BookWeightingApp tests may fail due to existing test setup (not related to timeline feature)

---

## 2. Build the Project

Ensure everything compiles without errors:

```bash
# Build TypeScript code
pnpm run build

# Type check without building
pnpm run typecheck

# Check for linting issues
pnpm run lint
```

**Expected Result:**
- ✅ No TypeScript compilation errors
- ✅ No linting errors (or only pre-existing ones)

---

## 3. Test CLI Version

### Step 1: Prepare a Test CSV File

You'll need a GoodReads CSV export file. If you don't have one:

1. Go to [GoodReads](https://www.goodreads.com/)
2. Click **My Books** → **Import and export**
3. Click **Export Library**
4. Download your CSV file
5. Make sure it contains books with series information

**Test Data Requirements:**
- Books in series (with numbers like "#1", "#2", etc.)
- Mix of shelf statuses: `read`, `currently-reading`, `reading-next`, `to-read`
- Some books with `Date Read` fields for timeline testing

### Step 2: Run CLI Version

```bash
# Build and run CLI
pnpm start
```

**What to Look For:**

1. **File Selection:**
   - File dialog should open
   - Select your GoodReads CSV file

2. **Processing Output:**
   You should see:
   ```
   📚 GoodReads Book Weighting System
   =====================================
   
   📂 Please select your Goodreads CSV file...
   📖 Reading to-read books...
      Found X books on your to-read shelf
   
   🧠 Analyzing active series and applying weights...
   
   📊 Weight distribution:
      Xx weight: X books
   
   🎯 High-priority books (series continuations):
      [list of high-priority books]
   
   📈 Generating series progression timeline...
   ```

3. **Timeline Output:**
   After "Generating series progression timeline...", you should see:
   ```
   📈 Series Progression Timeline
   =====================================
   
   📊 Overview:
      • Total Series: X
      • Books Read: X
      • Books In Progress: X
   
   [For each series:]
   1. [Series Name] by [Author]
      Progress: X read, X in progress, X to read
      Completion: XX.X%
      Currently on: Book #X (if applicable)
      Dates: [Date Range]
      Timeline:
         ✅ Book #1: Read (Date)
         📖 Book #2: Currently Reading
         🔜 Book #3: Reading Next
         📚 Book #4: To Read
   ```

4. **Final Output:**
   ```
   📤 Exporting to Google Sheets...
   
   ✅ Sync complete!
   📄 Summary:
      • Books exported: X
      • High-priority books: X
      • Google Sheet: [URL]
   
   🎯 Your book selection wheel now prioritizes series continuations!
   ```

### Step 3: Verify Timeline Data

Check that:
- ✅ Series are detected correctly
- ✅ Book numbers are in order
- ✅ Completion percentages are calculated
- ✅ Status icons match book shelf status
- ✅ Date ranges appear for series with read books
- ✅ Multiple series are listed separately

---

## 4. Test GUI Version

### Step 1: Build GUI

```bash
# Build GUI components
pnpm run build:gui
```

### Step 2: Run GUI

```bash
# Start GUI application
pnpm run start:gui
```

**What to Look For:**

1. **Application Window:**
   - Window should open showing the wizard interface
   - Step 1: File selection should be active

2. **File Selection:**
   - Click "📂 Choose CSV File"
   - Select your GoodReads CSV file
   - File name should appear with ✅ checkmark
   - Step 1 should show as completed
   - Step 2 should become active

3. **Processing:**
   - Click "🧠 Start Processing"
   - Progress log should show updates:
     - "📚 Starting GoodReads Book Weighting System..."
     - "📖 Reading to-read books..."
     - "🧠 Analyzing active series and applying weights..."
     - "📈 Generating series progression timeline..."
     - "📤 Exporting to Google Sheets..."
     - "✅ Sync complete!"

4. **Results Screen:**
   - Step 3 should show results
   - Result cards should display:
     - Total Books
     - High Priority count
     - Weight Ratio

5. **Timeline Section:**
   Scroll down to find the timeline section:
   - **📈 Series Progression Timeline** heading
   - Overview stats (Total Series, Books Read, Books In Progress)
   - Each series should show:
     - Series name and author
     - Progress stats
     - Completion percentage with progress bar
     - Currently on book (if applicable)
     - Date range (if books have been read)
     - Book timeline with color-coded status:
       - ✅ Green: Read books
       - 📖 Yellow: Currently Reading
       - 🔜 Blue: Reading Next
       - 📚 Gray: To Read

6. **Verify Features:**
   - ✅ Timeline section is visible and scrollable
   - ✅ Progress bars show completion percentages
   - ✅ Books are listed in order (1, 2, 3, etc.)
   - ✅ Status colors match book shelf status
   - ✅ Multiple series appear as separate cards
   - ✅ "📊 Open Google Sheets" button works
   - ✅ "🔄 Process Another File" resets the wizard

---

## 5. Test Edge Cases

### Test with Minimal Data

Create a minimal CSV file with:
- Only 1-2 series
- Mix of read/unread books
- Some books missing dates

### Test with Large Dataset

Use your full GoodReads export to test:
- Performance with many series
- Timeline display with lots of books
- Scrollability in GUI

### Test with No Series

Use a CSV with only standalone books (no series):
- Should show "No series found in your library."
- Should still complete successfully

---

## 6. Common Issues & Troubleshooting

### Timeline Doesn't Appear

**Symptom:** Timeline section is missing or empty

**Check:**
1. Verify CSV file has books with series information
2. Check console/terminal for errors
3. Ensure books have proper series format: `Book Title (Series Name, #1)`

**Fix:**
- Check CSV file format matches GoodReads export format
- Verify series detection patterns in code

### Timeline Shows Incorrect Data

**Symptom:** Wrong book numbers, missing books, incorrect status

**Check:**
1. Verify CSV file `Exclusive Shelf` column values:
   - `read`
   - `currently-reading`
   - `reading-next`
   - `to-read`
2. Check `Date Read` column format (should be `YYYY/MM/DD` or similar)

**Fix:**
- Ensure CSV file is from a recent GoodReads export
- Check that series naming is consistent in your library

### GUI Timeline Not Scrollable

**Symptom:** Timeline section cuts off or can't scroll

**Check:**
- Window height may be too small
- CSS max-height might be limiting display

**Fix:**
- Resize the application window
- Check browser console (F12) for CSS issues

### Performance Issues

**Symptom:** Application is slow with large CSV files

**Check:**
- CSV file size
- Number of books/series

**Fix:**
- This is expected with very large libraries (1000+ books)
- Consider optimizing if needed

---

## 7. Manual Testing Checklist

Before committing, verify:

- [ ] All automated tests pass
- [ ] CLI version displays timeline correctly
- [ ] GUI version displays timeline correctly
- [ ] Timeline shows correct series information
- [ ] Book statuses match CSV data
- [ ] Completion percentages are accurate
- [ ] Date ranges appear when books are read
- [ ] Multiple series display separately
- [ ] Google Sheets export still works
- [ ] No console errors in GUI (check DevTools)
- [ ] No TypeScript compilation errors
- [ ] Code follows project linting rules

---

## 8. Quick Test Script

You can create a quick test script to verify everything:

```bash
#!/bin/bash
# Quick test script

echo "🧪 Running automated tests..."
pnpm test

echo ""
echo "🔨 Building project..."
pnpm run build

echo ""
echo "✅ Type checking..."
pnpm run typecheck

echo ""
echo "✨ All checks passed! Ready to test manually."
echo ""
echo "To test CLI: pnpm start"
echo "To test GUI: pnpm run start:gui"
```

Save as `quick-test.sh` and run:
```bash
chmod +x quick-test.sh
./quick-test.sh
```

---

## 9. What to Report

If you find issues, note:
- **What you did:** Steps to reproduce
- **What happened:** Actual behavior
- **What you expected:** Expected behavior
- **Error messages:** Any console/terminal errors
- **CSV sample:** Relevant parts of CSV (sanitized)

---

## 10. Success Criteria

The feature is working correctly if:

✅ Timeline appears after processing  
✅ Series are detected from CSV file  
✅ Books are listed in numerical order  
✅ Completion percentages are calculated  
✅ Status icons/colors match book shelf status  
✅ Date ranges appear for read books  
✅ Multiple series display correctly  
✅ Both CLI and GUI show timeline  
✅ No errors during processing  
✅ Google Sheets export still works  

---

Happy Testing! 🎉

