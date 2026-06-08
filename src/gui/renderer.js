const { ipcRenderer } = require('electron');
const { marked } = require('marked');
const DOMPurify = require('dompurify');

class BookWeightingGUI {
  constructor() {
    this.selectedFilePath = null;
    this.results = null;
    this.activeEntryId = null;
    this.initializeEventListeners();
    this.initializeTabs();
    this.initializeSettings();
    this.initializeChat();
    this.loadJournal();
  }

  // ── Tab Navigation ──────────────────────────────────────────────────────────

  initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
        if (tab === 'chat') this.loadJournal();
      });
    });
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  initializeSettings() {
    document.getElementById('openSettingsBtn').addEventListener('click', async () => {
      const settings = await ipcRenderer.invoke('get-settings');
      if (settings.anthropicApiKey) {
        document.getElementById('apiKeyInput').value = settings.anthropicApiKey;
      }
      document.getElementById('settingsModal').classList.add('open');
    });

    document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
      document.getElementById('settingsModal').classList.remove('open');
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
      const key = document.getElementById('apiKeyInput').value.trim();
      await ipcRenderer.invoke('save-settings', { anthropicApiKey: key });
      document.getElementById('settingsModal').classList.remove('open');
    });

    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });
  }

  // ── Book Chat ────────────────────────────────────────────────────────────────

  initializeChat() {
    document.getElementById('newChatBtn').addEventListener('click', () => {
      this.showChatStartForm();
    });

    document.getElementById('startChatBtn').addEventListener('click', async () => {
      const title = document.getElementById('bookTitleInput').value.trim();
      const progress = document.getElementById('progressInput').value.trim();
      const errorEl = document.getElementById('chatStartError');

      if (!title || !progress) {
        errorEl.textContent = 'Please enter both a book title and your current progress.';
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';

      const btn = document.getElementById('startChatBtn');
      btn.disabled = true;
      btn.textContent = '🤖 Starting...';

      const response = await ipcRenderer.invoke('start-book-chat', title, progress);

      btn.disabled = false;
      btn.textContent = '🤖 Start Discussion';

      if (response.success) {
        this.loadJournal();
        this.openChatEntry(response.entry);
      } else {
        errorEl.textContent =
          response.error || 'Something went wrong. Check your API key in Settings.';
        errorEl.style.display = 'block';
      }
    });

    document.getElementById('sendMessageBtn').addEventListener('click', () => {
      this.sendChatMessage();
    });

    document.getElementById('chatMessageInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
  }

  async sendChatMessage() {
    const input = document.getElementById('chatMessageInput');
    const msg = input.value.trim();
    if (!msg || !this.activeEntryId) return;

    input.value = '';
    this.appendChatMessage({ role: 'user', content: msg });

    const sendBtn = document.getElementById('sendMessageBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = '...';
    this.showTypingIndicator();

    const response = await ipcRenderer.invoke('send-chat-message', this.activeEntryId, msg);

    this.hideTypingIndicator();
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';

    if (response.success) {
      this.appendChatMessage(response.message);
    } else {
      this.appendChatMessage({
        role: 'assistant',
        content: '⚠️ ' + (response.error || 'Something went wrong.'),
      });
    }
  }

  async loadJournal() {
    const entries = await ipcRenderer.invoke('get-journal');
    const list = document.getElementById('journalList');

    if (entries.length === 0) {
      list.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📝</div><div>No conversations yet</div></div>';
      return;
    }

    list.innerHTML = '';
    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'journal-item' + (entry.id === this.activeEntryId ? ' active' : '');
      item.dataset.id = entry.id;

      const date = new Date(entry.updatedAt).toLocaleDateString();
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div class="journal-item-title">${entry.bookTitle}</div>
            <div class="journal-item-meta">${entry.progress} · ${date}</div>
          </div>
          <button class="delete-btn" data-id="${entry.id}" title="Delete">✕</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        this.openChatEntry(entry);
      });

      item.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await ipcRenderer.invoke('delete-journal-entry', entry.id);
        if (this.activeEntryId === entry.id) this.showChatStartForm();
        this.loadJournal();
      });

      list.appendChild(item);
    });
  }

  openChatEntry(entry) {
    this.activeEntryId = entry.id;

    document.getElementById('chatStartForm').style.display = 'none';
    const panel = document.getElementById('activeChatPanel');
    panel.style.display = 'flex';

    document.getElementById('activeChatTitle').textContent = `💬 ${entry.bookTitle}`;
    document.getElementById('activeChatMeta').textContent = `Progress: ${entry.progress}`;

    const messagesEl = document.getElementById('chatMessages');
    messagesEl.innerHTML = '';
    entry.messages.forEach((m) => this.appendChatMessage(m));

    document.querySelectorAll('.journal-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === entry.id);
    });
  }

  appendChatMessage(msg) {
    const messagesEl = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-message ${msg.role}`;

    // Render markdown, then sanitize before inserting (XSS prevention)
    const html = marked.parse(msg.content, { breaks: true });
    div.innerHTML = DOMPurify.sanitize(html);

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  showTypingIndicator() {
    const messagesEl = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-message assistant typing-indicator';
    div.id = 'chatTypingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  hideTypingIndicator() {
    document.getElementById('chatTypingIndicator')?.remove();
  }

  showChatStartForm() {
    this.activeEntryId = null;
    document.getElementById('chatStartForm').style.display = 'flex';
    document.getElementById('activeChatPanel').style.display = 'none';
    document.getElementById('bookTitleInput').value = '';
    document.getElementById('progressInput').value = '';
    document.getElementById('chatStartError').style.display = 'none';
    document.querySelectorAll('.journal-item').forEach((el) => el.classList.remove('active'));
  }

  // ── Existing listeners ────────────────────────────────────────────────────

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
