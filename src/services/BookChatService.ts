import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { AppSettingsService } from './AppSettingsService';
import { getWritablePath } from '../utils/pathResolver';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  bookTitle: string;
  progress: string;
  startedAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const JOURNAL_FILE = getWritablePath('book-journal.json');

export class BookChatService {
  private static loadJournal(): JournalEntry[] {
    if (existsSync(JOURNAL_FILE)) {
      try {
        return JSON.parse(readFileSync(JOURNAL_FILE, 'utf-8'));
      } catch {
        // Corrupt — reset
      }
    }
    return [];
  }

  private static saveJournal(entries: JournalEntry[]): void {
    writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  }

  static getJournal(): JournalEntry[] {
    return this.loadJournal().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  static getEntry(id: string): JournalEntry | undefined {
    return this.loadJournal().find((e) => e.id === id);
  }

  static deleteEntry(id: string): void {
    const entries = this.loadJournal().filter((e) => e.id !== id);
    this.saveJournal(entries);
  }

  /**
   * Start a new book chat. Claude opens with a spoiler-aware summary of what has happened
   * up to the user's current progress point, then invites discussion.
   */
  static async startChat(bookTitle: string, progress: string): Promise<JournalEntry> {
    const apiKey = AppSettingsService.getAnthropicApiKey();
    if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings.');

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a book discussion companion. Your sole focus is discussing this specific book with the reader. You:
1. Give a warm, spoiler-aware summary of what has happened UP TO their stated progress point — do NOT reveal anything beyond where they are
2. Note interesting themes, character developments, or plot points from what they've read so far
3. Invite them to share their thoughts and reactions
4. Keep the discussion engaging and personal, like talking with a fellow reader

Rules:
- Stay strictly on topic: only discuss this book, its characters, themes, and plot
- If the user tries to change the subject or discuss unrelated topics, gently redirect back to the book
- Do not offer general writing advice, life advice, or discuss other books unless the user draws a direct comparison relevant to this book
- Do not reveal plot points beyond the user's stated progress

If you don't have reliable knowledge of the book's content at the specific progress point, say so honestly and ask the user to tell you what's happened so you can still discuss it with them.`;

    const openingMessage = `I'm reading "${bookTitle}". I'm currently at: ${progress}. Can you give me a summary of what's happened so far without spoiling what comes next, and then let's talk about it?`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: openingMessage }],
    });

    const assistantText =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, something went wrong.';

    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookTitle,
      progress,
      startedAt: now,
      updatedAt: now,
      messages: [
        { role: 'user', content: openingMessage, timestamp: now },
        { role: 'assistant', content: assistantText, timestamp: now },
      ],
    };

    const entries = this.loadJournal();
    entries.push(entry);
    this.saveJournal(entries);

    return entry;
  }

  /**
   * Send a follow-up message in an existing chat.
   */
  static async sendMessage(entryId: string, userMessage: string): Promise<ChatMessage> {
    const apiKey = AppSettingsService.getAnthropicApiKey();
    if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings.');

    const entries = this.loadJournal();
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) throw new Error('Journal entry not found.');

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a book discussion companion for "${entry.bookTitle}". The reader is at: ${entry.progress}.

Rules:
- Stay strictly focused on "${entry.bookTitle}" — do not drift to unrelated topics
- Do not spoil anything beyond the reader's stated progress point
- If the user goes off-topic, redirect the conversation back to the book naturally
- Only reference other books if the user makes a direct comparison relevant to this one
- Be engaging, thoughtful, and conversational`;

    // Build conversation history for Claude
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = entry.messages.map(
      (m) => ({ role: m.role, content: m.content }),
    );
    history.push({ role: 'user', content: userMessage });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: history,
    });

    const assistantText =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, something went wrong.';

    const now = new Date().toISOString();
    const userMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: now };
    const assistantMsg: ChatMessage = { role: 'assistant', content: assistantText, timestamp: now };

    entry.messages.push(userMsg, assistantMsg);
    entry.updatedAt = now;
    this.saveJournal(entries);

    return assistantMsg;
  }
}
