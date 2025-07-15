// Environment configuration for the Food Calorie Estimator app

export interface EnvironmentConfig {
  GEMINI_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production';
}

// Gemini AI configuration
export const GEMINI_CONFIG = {
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  MODEL: 'gemini-1.5-flash',
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  MAX_REQUESTS_PER_MINUTE: 15, // Free tier limit
  TIMEOUT: 30000, // 30 seconds
} as const;

// App configuration
export const APP_CONFIG = {
  DEFAULT_CALORIE_GOAL: 2000,
  DATA_RETENTION_DAYS: 30,
  MAX_DAILY_ENTRIES: 50,
  IMAGE_QUALITY: 0.8,
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB in bytes
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Storage keys
export const STORAGE_KEYS = {
  DAILY_ENTRIES: 'calorie_tracker_daily_entries',
  USER_SETTINGS: 'calorie_tracker_settings',
  DAILY_GOAL: 'calorie_tracker_daily_goal',
  LAST_CLEANUP: 'calorie_tracker_last_cleanup',
} as const;

// Get environment variables with validation
export function getConfig(): EnvironmentConfig {
  const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  };

  return config;
}

// Get API key with user override support
export function getApiKey(userApiKey?: string): string {
  // User-provided API key takes precedence
  if (userApiKey && userApiKey.trim()) {
    return userApiKey.trim();
  }
  
  // Fall back to environment variable
  const config = getConfig();
  if (config.GEMINI_API_KEY) {
    return config.GEMINI_API_KEY;
  }
  
  throw new Error('No API key available. Please provide your Gemini API key in settings or set GEMINI_API_KEY environment variable.');
}