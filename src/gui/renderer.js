const { ipcRenderer } = require('electron');

class BookWeightingGUI {
  constructor() {
    this.selectedFilePath = null;
    this.results = null;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // File selection
    document.getElementById('selectFileBtn').addEventListener('click', () => {
      this.selectCSVFile();
    });

    // Process books
    document.getElementById('processBtn').addEventListener('click', () => {
      this.processBooks();
    });

    // Open Google Sheets
    document.getElementById('openSheetsBtn').addEventListener('click', () => {
      this.openGoogleSheets();
    });

    // Process another file
    document.getElementById('processAnotherBtn').addEventListener('click', () => {
      this.resetToStart();
    });

    // Listen for progress updates
    ipcRenderer.on('progress-update', (event, message) => {
      this.updateProgress(message);
    });
  }

  async selectCSVFile() {
    try {
      const filePath = await ipcRenderer.invoke('select-csv-file');

      if (filePath) {
        this.selectedFilePath = filePath;
        this.updateFileSelection(filePath);
        this.activateStep2();
      }
    } catch (error) {
      this.showError('Failed to select file: ' + error.message);
    }
  }

  updateFileSelection(filePath) {
    const selectedFileDiv = document.getElementById('selectedFile');
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    selectedFileDiv.textContent = `✅ Selected: ${fileName}`;
    selectedFileDiv.classList.remove('hidden');

    // Mark step 1 as completed
    const step1 = document.getElementById('step1');
    step1.classList.add('completed');
    step1.classList.remove('active');
  }

  activateStep2() {
    const step2 = document.getElementById('step2');
    step2.classList.add('active');

    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = false;
  }

  async processBooks() {
    if (!this.selectedFilePath) {
      this.showError('Please select a CSV file first');
      return;
    }

    try {
      // Show processing UI
      document.getElementById('processing').classList.remove('hidden');
      document.getElementById('processBtn').disabled = true;

      // Clear previous progress
      document.getElementById('progressLog').textContent = '';

      // Process the books
      const response = await ipcRenderer.invoke('process-books', this.selectedFilePath);

      if (response.success) {
        this.results = response.result;
        this.showResults();
        this.activateStep3();
      } else {
        // Hide processing UI on error
        document.getElementById('processing').classList.add('hidden');
        this.showError('Processing failed: ' + response.error);
      }
    } catch (error) {
      // Hide processing UI on error
      document.getElementById('processing').classList.add('hidden');
      this.showError('Failed to process books: ' + error.message);
    }
  }

  updateProgress(message) {
    const progressLog = document.getElementById('progressLog');
    progressLog.textContent += message + '\n';
    progressLog.scrollTop = progressLog.scrollHeight;
  }

  showResults() {
    const results = this.results;

    // Hide processing UI now that we have results
    document.getElementById('processing').classList.add('hidden');

    // Update result cards
    document.getElementById('totalBooks').textContent = results.totalBooks;
    document.getElementById('highPriorityCount').textContent = results.highPriorityBooks.length;

    // Calculate weight ratio
    const ratio5x = results.weightDistribution[5] || 0;
    const ratio1x = results.weightDistribution[1] || 0;
    document.getElementById('weightRatio').textContent = `${ratio5x}:${ratio1x}`;

    // Show high-priority books if any
    if (results.highPriorityBooks.length > 0) {
      this.displayHighPriorityBooks(results.highPriorityBooks);
    }

    // Show timeline if available
    if (results.timeline) {
      this.displayTimeline(results.timeline);
    }

    // Show Google Sheets button
    if (results.sheetUrl) {
      document.getElementById('openSheetsBtn').classList.remove('hidden');
    }

    // Show results section
    document.getElementById('results').classList.remove('hidden');
  }

  displayHighPriorityBooks(books) {
    const section = document.getElementById('highPrioritySection');
    const list = document.getElementById('highPriorityList');

    list.innerHTML = '';

    books.forEach((weightedBook) => {
      const bookDiv = document.createElement('div');
      bookDiv.className = 'book-item';

      bookDiv.innerHTML = `
                <div class="book-title">📖 ${weightedBook.book.Title} (${weightedBook.weight}x weight)</div>
                <div class="book-author">by ${weightedBook.book.Author}</div>
                <div class="book-reason">${weightedBook.reason}</div>
            `;

      list.appendChild(bookDiv);
    });

    section.classList.remove('hidden');
  }

  displayTimeline(timeline) {
    const section = document.getElementById('timelineSection');
    const content = document.getElementById('timelineContent');

    content.innerHTML = '';

    // Overview stats
    const overviewDiv = document.createElement('div');
    overviewDiv.style.cssText =
      'margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px;';
    overviewDiv.innerHTML = `
      <strong>📊 Overview:</strong><br>
      • Total Series: ${timeline.totalSeries}<br>
      • Books Read: ${timeline.totalBooksRead}<br>
      • Books In Progress: ${timeline.totalBooksInProgress}
    `;
    content.appendChild(overviewDiv);

    if (timeline.series.length === 0) {
      const noSeriesDiv = document.createElement('div');
      noSeriesDiv.textContent = 'No series found in your library.';
      content.appendChild(noSeriesDiv);
      section.classList.remove('hidden');
      return;
    }

    // Display each series
    timeline.series.forEach((series) => {
      const seriesDiv = document.createElement('div');
      seriesDiv.className = 'series-timeline';

      // Series header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'series-header';
      headerDiv.textContent = `${series.seriesName} by ${series.author}`;
      seriesDiv.appendChild(headerDiv);

      // Series stats
      const statsDiv = document.createElement('div');
      statsDiv.className = 'series-stats';
      let statsText = `Progress: ${series.booksRead} read, ${series.booksInProgress} in progress, ${series.booksToRead} to read | `;
      statsText += `Completion: ${series.completionPercentage.toFixed(1)}%`;
      if (series.currentBookNumber) {
        statsText += ` | Currently on: Book #${series.currentBookNumber}`;
      }
      if (series.firstReadDate && series.lastReadDate) {
        const firstDate = series.firstReadDate.toLocaleDateString();
        const lastDate = series.lastReadDate.toLocaleDateString();
        if (firstDate === lastDate) {
          statsText += ` | Date: ${firstDate}`;
        } else {
          statsText += ` | Dates: ${firstDate} - ${lastDate}`;
        }
      }
      statsDiv.textContent = statsText;
      seriesDiv.appendChild(statsDiv);

      // Progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${Math.min(series.completionPercentage, 100)}%`;
      progressFill.textContent = `${series.completionPercentage.toFixed(1)}%`;
      progressBar.appendChild(progressFill);
      seriesDiv.appendChild(progressBar);

      // Book timeline
      const booksContainer = document.createElement('div');
      booksContainer.style.marginTop = '10px';

      series.books.forEach((book) => {
        const bookDiv = document.createElement('div');
        bookDiv.className = `book-timeline-item ${book.status}`;

        const statusIcon = this.getStatusIcon(book.status);
        const statusText = this.getStatusText(book.status);
        const dateStr = book.dateRead ? ` (${book.dateRead.toLocaleDateString()})` : '';

        // Show book number and title
        bookDiv.innerHTML = `${statusIcon} <strong>Book #${book.bookNumber}:</strong> "${book.title}" - ${statusText}${dateStr}`;
        booksContainer.appendChild(bookDiv);
      });

      seriesDiv.appendChild(booksContainer);
      content.appendChild(seriesDiv);
    });

    section.classList.remove('hidden');
  }

  getStatusIcon(status) {
    switch (status) {
      case 'read':
        return '✅';
      case 'currently-reading':
        return '📖';
      case 'reading-next':
        return '🔜';
      case 'to-read':
        return '📚';
      default:
        return '⚪';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'read':
        return 'Read';
      case 'currently-reading':
        return 'Currently Reading';
      case 'reading-next':
        return 'Reading Next';
      case 'to-read':
        return 'To Read';
      default:
        return 'Not Started';
    }
  }

  activateStep3() {
    // Mark step 2 as completed
    const step2 = document.getElementById('step2');
    step2.classList.add('completed');
    step2.classList.remove('active');

    // Activate step 3
    const step3 = document.getElementById('step3');
    step3.classList.add('active');
    step3.classList.add('completed');

    // Show success icon
    document.getElementById('successIcon').classList.remove('hidden');
  }

  async openGoogleSheets() {
    if (this.results && this.results.sheetUrl) {
      try {
        await ipcRenderer.invoke('open-sheets-url', this.results.sheetUrl);
      } catch (error) {
        this.showError('Failed to open Google Sheets: ' + error.message);
      }
    }
  }

  resetToStart() {
    // Reset state
    this.selectedFilePath = null;
    this.results = null;

    // Reset UI
    document.getElementById('selectedFile').classList.add('hidden');
    document.getElementById('processing').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('highPrioritySection').classList.add('hidden');
    document.getElementById('timelineSection').classList.add('hidden');
    document.getElementById('openSheetsBtn').classList.add('hidden');
    document.getElementById('successIcon').classList.add('hidden');

    // Reset steps
    document.getElementById('step1').className = 'step active';
    document.getElementById('step2').className = 'step';
    document.getElementById('step3').className = 'step';

    // Reset buttons
    document.getElementById('processBtn').disabled = true;

    // Clear progress log
    document.getElementById('progressLog').textContent = '';
  }

  showError(message) {
    alert('Error: ' + message);
    console.error(message);
  }
}

// Initialize the GUI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new BookWeightingGUI();
});
