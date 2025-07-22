// Utility functions for the Food Calorie Estimator app

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FoodEntry, DailyData, AppError } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export const dateUtils = {
  // Get current date in YYYY-MM-DD format
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  // Format date for display
  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get date range for the past week
  getWeekDateRange(): string[] {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  },

  // Check if date is today
  isToday(dateString: string): boolean {
    return dateString === this.getCurrentDate();
  },

  // Get days ago from current date
  getDaysAgo(dateString: string): number {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
};

// Data validation utilities
export const validation = {
  // Validate food entry data
  validateFoodEntry(entry: Partial<FoodEntry>): entry is FoodEntry {
    return !!(
      entry.id &&
      entry.timestamp &&
      entry.foods &&
      Array.isArray(entry.foods) &&
      entry.foods.length > 0 &&
      typeof entry.totalCalories === 'number' &&
      entry.totalCalories >= 0 &&
      entry.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    );
  },

  // Validate calorie goal
  validateCalorieGoal(goal: number): boolean {
    return typeof goal === 'number' && goal > 0 && goal <= 10000;
  },

  // Validate image data
  validateImageData(imageData: string): boolean {
    return typeof imageData === 'string' && imageData.startsWith('data:image/');
  },

  // Validate API key format
  validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length > 10;
  },

  // Validate user profile data
  validateUserProfile(profile: Partial<import('@/types').UserProfile>): profile is import('@/types').UserProfile {
    return !!(
      typeof profile.hasCompletedOnboarding === 'boolean' &&
      profile.personalInfo &&
      profile.activity &&
      profile.goals &&
      profile.preferences &&
      profile.metadata &&
      typeof profile.metadata.createdAt === 'string' &&
      typeof profile.metadata.lastUpdated === 'string' &&
      typeof profile.metadata.onboardingVersion === 'string'
    );
  },

  // Validate age range
  validateAge(age: number): boolean {
    return typeof age === 'number' && age >= 13 && age <= 120;
  },

  // Validate height values
  validateHeight(height: { value: number; unit: 'cm' | 'ft_in' }): boolean {
    if (!height || typeof height.value !== 'number') return false;
    
    if (height.unit === 'cm') {
      return height.value >= 100 && height.value <= 250;
    } else if (height.unit === 'ft_in') {
      return height.value >= 3 && height.value <= 8;
    }
    
    return false;
  },

  // Validate weight values
  validateWeight(weight: { value: number; unit: 'kg' | 'lbs' }): boolean {
    if (!weight || typeof weight.value !== 'number') return false;
    
    if (weight.unit === 'kg') {
      return weight.value >= 30 && weight.value <= 300;
    } else if (weight.unit === 'lbs') {
      return weight.value >= 66 && weight.value <= 660;
    }
    
    return false;
  },

  // Validate activity level
  validateActivityLevel(level: string): level is 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' {
    return ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(level);
  },

  // Validate exercise frequency
  validateExerciseFrequency(frequency: number): boolean {
    return typeof frequency === 'number' && frequency >= 0 && frequency <= 7;
  },

  // Validate fitness goal
  validateFitnessGoal(goal: string): goal is 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_building' {
    return ['weight_loss', 'weight_gain', 'maintenance', 'muscle_building'].includes(goal);
  }
};

// Image processing utilities
export const imageUtils = {
  // Compress image to target size with progressive quality reduction
  async compressImage(file: File, maxSizeKB: number = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions with aspect ratio preservation
        const maxWidth = 1024;
        const maxHeight = 1024;
        let { width, height } = img;

        // Smart resizing algorithm
        const aspectRatio = width / height;
        if (width > maxWidth || height > maxHeight) {
          if (aspectRatio > 1) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        // Use high-quality image rendering
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Progressive quality reduction with size checking
        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);
        const targetSize = maxSizeKB * 1024;
        
        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = 0.9;
        
        while (result.length > targetSize && minQuality < maxQuality) {
          quality = (minQuality + maxQuality) / 2;
          result = canvas.toDataURL('image/jpeg', quality);
          
          if (result.length > targetSize) {
            maxQuality = quality;
          } else {
            minQuality = quality;
          }
          
          // Prevent infinite loop
          if (maxQuality - minQuality < 0.01) break;
        }

        // Cleanup
        URL.revokeObjectURL(img.src);
        resolve(result);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  },

  // Convert file to base64 with size validation
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file size before processing
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File too large'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  // Preload image for better UX
  async preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to preload image'));
      img.src = src;
    });
  },

  // Create thumbnail for preview
  async createThumbnail(file: File, size: number = 150): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // Calculate crop dimensions for square thumbnail
        const { width, height } = img;
        const minDimension = Math.min(width, height);
        const startX = (width - minDimension) / 2;
        const startY = (height - minDimension) / 2;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            img,
            startX, startY, minDimension, minDimension,
            0, 0, size, size
          );
        }

        const result = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(img.src);
        resolve(result);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to create thumbnail'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
};

// Error handling utilities
export const errorUtils = {
  // Create user-friendly error messages
  getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'camera':
        return error.message.includes('permission') 
          ? 'Camera access denied. Please enable camera permissions in your browser settings.'
          : 'Camera not available. Please try again or use the file upload option.';
      
      case 'api':
        if (error.message.includes('rate limit')) {
          return 'Too many requests. Please wait a moment and try again.';
        }
        if (error.message.includes('key')) {
          return 'API configuration error. Please check your settings.';
        }
        return 'Analysis failed. Please check your internet connection and try again.';
      
      case 'storage':
        return 'Unable to save data. Please check your browser storage settings.';
      
      case 'network':
        return 'Network error. Please check your internet connection.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  },

  // Log error for debugging
  logError(error: AppError, context?: string): void {
    console.error(`[${error.type.toUpperCase()}] ${context || 'Error'}:`, error);
  }
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Storage quota utilities
export const storageUtils = {
  // Check if localStorage is available
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Get storage usage information
  getStorageUsage(): { used: number; total: number; percentage: number } {
    if (!this.isStorageAvailable()) {
      return { used: 0, total: 0, percentage: 0 };
    }

    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Estimate 5MB total (typical browser limit)
    const total = 5 * 1024 * 1024;
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  },

  // Check if storage is nearly full
  isStorageNearlyFull(): boolean {
    const usage = this.getStorageUsage();
    return usage.percentage > 80;
  }
};

// Calculate weekly average
export function calculateWeeklyAverage(weeklyData: DailyData[]): number {
  if (weeklyData.length === 0) return 0;
  
  const total = weeklyData.reduce((sum, day) => sum + day.totalCalories, 0);
  return Math.round(total / weeklyData.length);
}

// Format calories for display
export function formatCalories(calories: number): string {
  return Math.round(calories).toLocaleString();
}