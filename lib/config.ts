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
  // Default test API key for users to try the app
  DEFAULT_TEST_API_KEY: 'AIzaSyCwIBFPUSFZf5Ew00lT4fq6SbfEsCbCMkI',
  // Rate limiting for default test key
  DEFAULT_KEY_LIMITS: {
    REQUESTS_PER_MINUTE: 10, // Lower limit for shared test key
    REQUESTS_PER_DAY: 100,   // Daily limit for test users
    MAX_CONCURRENT_USERS: 50, // Estimated concurrent users
  },
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

// Get API key with user override support and default test key
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
  
  // Use default test API key as final fallback
  if (APP_CONFIG.DEFAULT_TEST_API_KEY) {
    return APP_CONFIG.DEFAULT_TEST_API_KEY;
  }
  
  throw new Error('No API key available. Please provide your Gemini API key in settings.');
}

// Check if using default test key
export function isUsingDefaultTestKey(userApiKey?: string): boolean {
  const apiKey = getApiKey(userApiKey);
  return apiKey === APP_CONFIG.DEFAULT_TEST_API_KEY;
}

// Get rate limits based on key type
export function getRateLimits(userApiKey?: string) {
  if (isUsingDefaultTestKey(userApiKey)) {
    return {
      requestsPerMinute: APP_CONFIG.DEFAULT_KEY_LIMITS.REQUESTS_PER_MINUTE,
      requestsPerDay: APP_CONFIG.DEFAULT_KEY_LIMITS.REQUESTS_PER_DAY,
      isSharedKey: true,
    };
  }
  
  return {
    requestsPerMinute: GEMINI_CONFIG.MAX_REQUESTS_PER_MINUTE,
    requestsPerDay: 1500, // Standard free tier daily limit
    isSharedKey: false,
  };
}