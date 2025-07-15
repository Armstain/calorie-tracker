// Local storage service for the Food Calorie Estimator app

import { FoodEntry, DailyData, UserSettings, StorageError } from '@/types';
import { STORAGE_KEYS, APP_CONFIG } from '@/lib/config';
import { dateUtils, validation, generateId } from '@/lib/utils';

export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Settings Management
  getUserSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored) as UserSettings;
        return {
          dailyCalorieGoal: settings.dailyCalorieGoal || APP_CONFIG.DEFAULT_CALORIE_GOAL,
          apiKey: settings.apiKey || '',
          notifications: settings.notifications ?? true,
          dataRetentionDays: settings.dataRetentionDays || APP_CONFIG.DATA_RETENTION_DAYS,
        };
      }
    } catch (error) {
      console.error('Error reading user settings:', error);
    }

    // Return default settings
    return {
      dailyCalorieGoal: APP_CONFIG.DEFAULT_CALORIE_GOAL,
      apiKey: '',
      notifications: true,
      dataRetentionDays: APP_CONFIG.DATA_RETENTION_DAYS,
    };
  }

  updateUserSettings(settings: Partial<UserSettings>): void {
    try {
      const currentSettings = this.getUserSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      throw this.createStorageError('Failed to update user settings', error);
    }
  }

  // API Key Management
  getUserApiKey(): string {
    const settings = this.getUserSettings();
    return settings.apiKey || '';
  }

  setUserApiKey(apiKey: string): void {
    if (!validation.validateApiKey(apiKey)) {
      throw this.createStorageError('Invalid API key format');
    }
    this.updateUserSettings({ apiKey });
  }

  // Daily Goal Management
  getDailyGoal(): number {
    const settings = this.getUserSettings();
    return settings.dailyCalorieGoal;
  }

  updateDailyGoal(goal: number): void {
    if (!validation.validateCalorieGoal(goal)) {
      throw this.createStorageError('Invalid calorie goal. Must be between 1 and 10,000.');
    }
    this.updateUserSettings({ dailyCalorieGoal: goal });
  }

  // Food Entry Management
  saveFoodEntry(entry: Omit<FoodEntry, 'id'>): FoodEntry {
    try {
      const fullEntry: FoodEntry = {
        ...entry,
        id: generateId(),
      };

      if (!validation.validateFoodEntry(fullEntry)) {
        throw this.createStorageError('Invalid food entry data');
      }

      const entries = this.getAllEntries();
      entries.push(fullEntry);
      
      // Sort by timestamp (newest first)
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(entries));
      
      // Trigger cleanup if needed
      this.cleanupOldEntries();
      
      return fullEntry;
    } catch (error) {
      throw this.createStorageError('Failed to save food entry', error);
    }
  }

  getDailyEntries(date: string): FoodEntry[] {
    try {
      const allEntries = this.getAllEntries();
      return allEntries.filter(entry => entry.date === date);
    } catch (error) {
      console.error('Error getting daily entries:', error);
      return [];
    }
  }

  getTodaysEntries(): FoodEntry[] {
    return this.getDailyEntries(dateUtils.getCurrentDate());
  }

  getTodaysCalories(): number {
    const todaysEntries = this.getTodaysEntries();
    return todaysEntries.reduce((total, entry) => total + entry.totalCalories, 0);
  }

  // Weekly Data Management
  getWeeklyData(): DailyData[] {
    try {
      const weekDates = dateUtils.getWeekDateRange();
      const dailyGoal = this.getDailyGoal();
      
      return weekDates.map(date => {
        const entries = this.getDailyEntries(date);
        const totalCalories = entries.reduce((sum, entry) => sum + entry.totalCalories, 0);
        
        return {
          date,
          totalCalories,
          goalCalories: dailyGoal,
          entries,
          goalMet: totalCalories >= dailyGoal,
        };
      });
    } catch (error) {
      console.error('Error getting weekly data:', error);
      return [];
    }
  }

  // Data Management
  private getAllEntries(): FoodEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES);
      if (stored) {
        const entries = JSON.parse(stored) as FoodEntry[];
        return entries.filter(entry => validation.validateFoodEntry(entry));
      }
    } catch (error) {
      console.error('Error reading entries from storage:', error);
    }
    return [];
  }

  // Data Cleanup
  cleanupOldEntries(): void {
    try {
      const lastCleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP);
      const now = Date.now();
      
      // Only cleanup once per day
      if (lastCleanup && now - parseInt(lastCleanup) < 24 * 60 * 60 * 1000) {
        return;
      }

      const settings = this.getUserSettings();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);
      const cutoffString = cutoffDate.toISOString().split('T')[0];

      const allEntries = this.getAllEntries();
      const filteredEntries = allEntries.filter(entry => entry.date >= cutoffString);

      if (filteredEntries.length !== allEntries.length) {
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(filteredEntries));
        console.log(`Cleaned up ${allEntries.length - filteredEntries.length} old entries`);
      }

      localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toString());
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Delete specific entry
  deleteEntry(entryId: string): boolean {
    try {
      const entries = this.getAllEntries();
      const filteredEntries = entries.filter(entry => entry.id !== entryId);
      
      if (filteredEntries.length !== entries.length) {
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(filteredEntries));
        return true;
      }
      return false;
    } catch (error) {
      throw this.createStorageError('Failed to delete entry', error);
    }
  }

  // Export data
  exportData(): string {
    try {
      const data = {
        settings: this.getUserSettings(),
        entries: this.getAllEntries(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw this.createStorageError('Failed to export data', error);
    }
  }

  // Import data
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) {
        this.updateUserSettings(data.settings);
      }
      
      if (data.entries && Array.isArray(data.entries)) {
        const validEntries = data.entries.filter((entry: unknown) => validation.validateFoodEntry(entry as Partial<FoodEntry>));
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(validEntries));
      }
    } catch (error) {
      throw this.createStorageError('Failed to import data. Invalid format.', error);
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DAILY_ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.LAST_CLEANUP);
    } catch (error) {
      throw this.createStorageError('Failed to clear data', error);
    }
  }

  // Storage quota management
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate available storage (5MB typical limit)
      const estimated = 5 * 1024 * 1024;
      const available = estimated - used;
      const percentage = (used / estimated) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Error helper
  private createStorageError(message: string, originalError?: unknown): StorageError {
    return {
      type: 'storage',
      message,
      code: originalError && typeof originalError === 'object' && 'name' in originalError 
        ? String(originalError.name) 
        : 'STORAGE_ERROR',
    };
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();