import path from 'path';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { GoodreadsCSVService } from '../services/GoodreadsCSVService';
import { BookWeightingService } from '../services/ToReadSeriesService';
import { selectCSVFile } from '../gui/launchFileDialog';

/**
 * Main application orchestrator
 */
export class BookWeightingApp {
    
    static async run() {
        try {
            console.log('📚 GoodReads Book Weighting System');
            console.log('=====================================\n');
            
            console.log('📂 Please select your Goodreads CSV file...');
            const filePath = selectCSVFile();
            const resolvedPath = path.resolve(filePath);
            
            // Get to-read books (these are what go to the wheel)
            console.log('📖 Reading to-read books...');
            const toReadBooks = await GoodreadsCSVService.getToReadBooks(resolvedPath);
            console.log(`   Found ${toReadBooks.length} books on your to-read shelf\n`);
            
            // Apply intelligent weighting based on series continuation
            console.log('🧠 Analyzing active series and applying weights...');
            const weightedBooks = await BookWeightingService.applyWeights(toReadBooks, resolvedPath);
            
            // Show weight distribution
            const weightCounts = weightedBooks.reduce((acc, wb) => {
                acc[wb.weight] = (acc[wb.weight] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);
            
            console.log('\n📊 Weight distribution:');
            Object.entries(weightCounts)
                .sort(([a], [b]) => Number(b) - Number(a))
                .forEach(([weight, count]) => {
                    console.log(`   ${weight}x weight: ${count} books`);
                });

            // Show high-priority books
            const highPriorityBooks = weightedBooks.filter(wb => wb.weight > 1);
            if (highPriorityBooks.length > 0) {
                console.log('\n🎯 High-priority books (series continuations):');
                highPriorityBooks.forEach(wb => {
                    console.log(`   📖 ${wb.book.Title} by ${wb.book.Author} (${wb.weight}x)`);
                    console.log(`      Reason: ${wb.reason}\n`);
                });
            }
            
            // Export to Google Sheets
            console.log('📤 Exporting to Google Sheets...');
            const sheetId = await GoogleSheetsService.getOrCreateSheet();
            await GoogleSheetsService.writeWeightedBooksToSheet(sheetId, weightedBooks);
            
            console.log('\n✅ Sync complete!');
            console.log('📄 Summary:');
            console.log(`  • Books exported: ${weightedBooks.length}`);
            console.log(`  • High-priority books: ${highPriorityBooks.length}`);
            console.log(`  • Google Sheet: https://docs.google.com/spreadsheets/d/${sheetId}`);
            console.log('\n🎯 Your book selection wheel now prioritizes series continuations!');
            
        } catch (error: any) {
            console.error('❌ An unexpected error occurred:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            process.exit(1);
        }
    }

    static async runWithProgress(csvFilePath: string, progressCallback?: (message: string) => void) {
        try {
            progressCallback?.('📚 Starting GoodReads Book Weighting System...');
            
            // Get to-read books (these are what go to the wheel)
            progressCallback?.('📖 Reading to-read books...');
            const toReadBooks = await GoodreadsCSVService.getToReadBooks(csvFilePath);
            progressCallback?.(`   Found ${toReadBooks.length} books on your to-read shelf`);
            
            // Apply intelligent weighting based on series continuation
            progressCallback?.('🧠 Analyzing active series and applying weights...');
            const weightedBooks = await BookWeightingService.applyWeights(toReadBooks, csvFilePath);
            
            // Show weight distribution
            const weightCounts = weightedBooks.reduce((acc, wb) => {
                acc[wb.weight] = (acc[wb.weight] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);
            
            const weightDistribution = Object.entries(weightCounts)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([weight, count]) => `${weight}x weight: ${count} books`)
                .join(', ');
            
            progressCallback?.(`📊 Weight distribution: ${weightDistribution}`);

            // Show high-priority books
            const highPriorityBooks = weightedBooks.filter(wb => wb.weight > 1);
            if (highPriorityBooks.length > 0) {
                progressCallback?.(`🎯 Found ${highPriorityBooks.length} high-priority books (series continuations)`);
            }
            
            // Export to Google Sheets
            progressCallback?.('📤 Exporting to Google Sheets...');
            const sheetId = await GoogleSheetsService.getOrCreateSheet();
            await GoogleSheetsService.writeWeightedBooksToSheet(sheetId, weightedBooks);
            
            progressCallback?.('✅ Sync complete!');
            
            return {
                totalBooks: weightedBooks.length,
                highPriorityBooks: highPriorityBooks,
                weightDistribution: weightCounts,
                sheetId: sheetId,
                sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`
            };
            
        } catch (error: any) {
            progressCallback?.(`❌ Error: ${error.message}`);
            throw error;
        }
    }
}
