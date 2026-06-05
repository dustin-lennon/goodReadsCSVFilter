import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getWritablePath } from '../utils/pathResolver';

interface AppSettings {
  anthropicApiKey?: string;
}

const SETTINGS_FILE = getWritablePath('config.json');

export class AppSettingsService {
  private static settings: AppSettings | null = null;

  static load(): AppSettings {
    if (this.settings) return this.settings;

    if (existsSync(SETTINGS_FILE)) {
      try {
        this.settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
        return this.settings!;
      } catch {
        // Corrupt file — reset
      }
    }

    this.settings = {};
    return this.settings;
  }

  static save(settings: AppSettings): void {
    this.settings = { ...this.load(), ...settings };
    writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
  }

  static getAnthropicApiKey(): string | undefined {
    return this.load().anthropicApiKey;
  }

  static hasAnthropicApiKey(): boolean {
    return !!this.getAnthropicApiKey();
  }
}
