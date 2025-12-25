// Local storage service for the Food Calorie Estimator app

import { FoodEntry, DailyData, UserSettings, StorageError, UserProfile, StoredProfile } from '@/types';
import { STORAGE_KEYS, APP_CONFIG } from '@/lib/config';
import { dateUtils, validation, generateId } from '@/lib/utils';
import { storageOptimizer } from '@/lib/storageOptimizer';

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
      if (typeof window === 'undefined') {
        return {
          dailyCalorieGoal: APP_CONFIG.DEFAULT_CALORIE_GOAL,
          apiKey: '',
          notifications: true,
          dataRetentionDays: APP_CONFIG.DATA_RETENTION_DAYS,
        };
      }
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
      if (typeof window === 'undefined') {
        return;
      }
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
  async saveFoodEntry(entry: Omit<FoodEntry, 'id'>): Promise<FoodEntry> {
    try {
      // Optimize entry before saving (removes images by default)
      const optimizedEntry = await storageOptimizer.optimizeFoodEntry(entry);
      
      const fullEntry: FoodEntry = {
        ...optimizedEntry,
        id: generateId(),
      };

      if (!validation.validateFoodEntry(fullEntry)) {
        throw this.createStorageError('Invalid food entry data');
      }

      const entries = this.getAllEntries();
      entries.push(fullEntry);
      
      // Sort by timestamp (newest first)
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(entries));
      }
      
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
      if (typeof window === 'undefined') {
        return [];
      }
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
      if (typeof window === 'undefined') {
        return;
      }
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
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(filteredEntries));
        }
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
        profile: this.getUserProfile(),
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
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(validEntries));
        }
      }

      if (data.profile && validation.validateUserProfile(data.profile)) {
        this.saveUserProfile(data.profile);
      }
    } catch (error) {
      throw this.createStorageError('Failed to import data. Invalid format.', error);
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(STORAGE_KEYS.DAILY_ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.LAST_CLEANUP);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      throw this.createStorageError('Failed to clear data', error);
    }
  }

  // Clear today's entries
  clearTodaysEntries(): number {
    try {
      const todaysEntries = this.getTodaysEntries();
      const allEntries = this.getAllEntries();
      const todaysDate = dateUtils.getCurrentDate();
      
      const filteredEntries = allEntries.filter(entry => entry.date !== todaysDate);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(filteredEntries));
      }
      
      return todaysEntries.length;
    } catch (error) {
      throw this.createStorageError('Failed to clear today\'s entries', error);
    }
  }

  // Clear this week's entries
  clearWeekEntries(): number {
    try {
      const weekDates = dateUtils.getWeekDateRange();
      const allEntries = this.getAllEntries();
      
      const filteredEntries = allEntries.filter(entry => !weekDates.includes(entry.date));
      const deletedCount = allEntries.length - filteredEntries.length;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(filteredEntries));
      }
      
      return deletedCount;
    } catch (error) {
      throw this.createStorageError('Failed to clear week entries', error);
    }
  }

  // Storage quota management
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      if (typeof window === 'undefined') {
        return { used: 0, available: 5000000, percentage: 0 };
      }
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

  // Storage optimization methods
  getOptimizationRecommendations() {
    return storageOptimizer.getOptimizationRecommendations();
  }

  performStorageOptimization(): { deletedEntries: number; spaceSaved: number } {
    return storageOptimizer.performCleanup();
  }

  updateOptimizationConfig(config: Partial<Parameters<typeof storageOptimizer.updateConfig>[0]>) {
    storageOptimizer.updateConfig(config);
  }

  getOptimizationConfig() {
    return storageOptimizer.getConfig();
  }

  // User Profile Management
  getUserProfile(): UserProfile | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        const storedProfile = JSON.parse(stored) as StoredProfile;
        if (storedProfile.version === '1.0' && validation.validateUserProfile(storedProfile.profile)) {
          return storedProfile.profile;
        }
      }
    } catch (error) {
      console.error('Error reading user profile:', error);
    }
    return null;
  }

  saveUserProfile(profile: UserProfile): void {
    try {
      if (!validation.validateUserProfile(profile)) {
        throw this.createStorageError('Invalid user profile data');
      }

      const storedProfile: StoredProfile = {
        version: '1.0',
        profile: {
          ...profile,
          metadata: {
            ...profile.metadata,
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(storedProfile));
      }
    } catch (error) {
      throw this.createStorageError('Failed to save user profile', error);
    }
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    try {
      const currentProfile = this.getUserProfile();
      if (!currentProfile) {
        throw this.createStorageError('No existing profile to update');
      }

      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updates,
        personalInfo: {
          ...currentProfile.personalInfo,
          ...updates.personalInfo,
        },
        activity: {
          ...currentProfile.activity,
          ...updates.activity,
        },
        goals: {
          ...currentProfile.goals,
          ...updates.goals,
        },
        preferences: {
          ...currentProfile.preferences,
          ...updates.preferences,
        },
        metadata: {
          ...currentProfile.metadata,
          ...updates.metadata,
          lastUpdated: new Date().toISOString(),
        },
      };

      this.saveUserProfile(updatedProfile);
    } catch (error) {
      throw this.createStorageError('Failed to update user profile', error);
    }
  }

  hasCompletedOnboarding(): boolean {
    const profile = this.getUserProfile();
    return profile?.hasCompletedOnboarding ?? false;
  }

  markOnboardingComplete(profile: UserProfile): void {
    try {
      const completeProfile: UserProfile = {
        ...profile,
        hasCompletedOnboarding: true,
        metadata: {
          ...profile.metadata,
          createdAt: profile.metadata.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          onboardingVersion: '1.0',
        },
      };

      this.saveUserProfile(completeProfile);
    } catch (error) {
      throw this.createStorageError('Failed to mark onboarding complete', error);
    }
  }

  resetUserProfile(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      throw this.createStorageError('Failed to reset user profile', error);
    }
  }

  // BMR and calorie calculation utilities
  calculateBMR(profile: UserProfile): number | null {
    const { personalInfo } = profile;
    
    if (!personalInfo.age || !personalInfo.gender || !personalInfo.height || !personalInfo.weight) {
      return null;
    }

    // Validate required data
    if (!validation.validateAge(personalInfo.age) || 
        !validation.validateHeight(personalInfo.height) || 
        !validation.validateWeight(personalInfo.weight)) {
      return null;
    }

    // Convert to metric units for calculation
    let heightCm = personalInfo.height.value;
    if (personalInfo.height.unit === 'ft_in') {
      heightCm = personalInfo.height.value * 30.48; // feet to cm
    }

    let weightKg = personalInfo.weight.value;
    if (personalInfo.weight.unit === 'lbs') {
      weightKg = personalInfo.weight.value * 0.453592; // lbs to kg
    }

    // Harris-Benedict Equation (Revised)
    let bmr: number;
    if (personalInfo.gender === 'male') {
      bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * personalInfo.age);
    } else {
      // Use female formula for all non-male genders
      bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * personalInfo.age);
    }

    return Math.round(bmr);
  }

  calculateDailyCalories(profile: UserProfile): number | null {
    const bmr = this.calculateBMR(profile);
    if (!bmr) return null;

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const activityLevel = profile.activity.level || 'moderate';
    const multiplier = activityMultipliers[activityLevel];
    let dailyCalories = bmr * multiplier;

    // Apply goal-based adjustments
    if (profile.goals.primary) {
      switch (profile.goals.primary) {
        case 'weight_loss':
          dailyCalories *= 0.85; // 15% deficit
          break;
        case 'weight_gain':
          dailyCalories *= 1.15; // 15% surplus
          break;
        case 'muscle_building':
          dailyCalories *= 1.1; // 10% surplus
          break;
        case 'maintenance':
        default:
          // No adjustment needed
          break;
      }
    }

    return Math.round(dailyCalories);
  }

  // Profile validation helpers
  validateProfileData(profile: Partial<UserProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profile.personalInfo) {
      if (profile.personalInfo.age !== undefined && !validation.validateAge(profile.personalInfo.age)) {
        errors.push('Age must be between 13 and 120 years');
      }

      if (profile.personalInfo.height && !validation.validateHeight(profile.personalInfo.height)) {
        errors.push('Invalid height value');
      }

      if (profile.personalInfo.weight && !validation.validateWeight(profile.personalInfo.weight)) {
        errors.push('Invalid weight value');
      }
    }

    if (profile.activity) {
      if (profile.activity.level && !validation.validateActivityLevel(profile.activity.level)) {
        errors.push('Invalid activity level');
      }

      if (profile.activity.exerciseFrequency !== undefined && 
          !validation.validateExerciseFrequency(profile.activity.exerciseFrequency)) {
        errors.push('Exercise frequency must be between 0 and 7 days per week');
      }
    }

    if (profile.goals?.primary && !validation.validateFitnessGoal(profile.goals.primary)) {
      errors.push('Invalid fitness goal');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
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