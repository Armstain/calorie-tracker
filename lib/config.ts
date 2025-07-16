// Environment configuration for the Food Calorie Estimator app

export interface EnvironmentConfig {
  GEMINI_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production';
}

// Gemini AI configuration with model fallback support
export const GEMINI_MODELS = {
  'gemini-2.0-flash': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 1, // Highest priority
  },
  'gemini-1.5-pro': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    maxRequestsPerMinute: 2,
    maxRequestsPerDay: 50,
    priority: 2,
  },
  'gemini-1.5-flash': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 3, // Fallback
  },
} as const;

export const GEMINI_CONFIG = {
  MODELS: GEMINI_MODELS,
  DEFAULT_MODEL: 'gemini-2.0-flash',
  FALLBACK_ORDER: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
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

// Get rate limits based on key type and model
export function getRateLimits(userApiKey?: string, modelName?: keyof typeof GEMINI_MODELS) {
  const model = modelName || GEMINI_CONFIG.DEFAULT_MODEL;
  const modelConfig = GEMINI_MODELS[model];
  
  if (isUsingDefaultTestKey(userApiKey)) {
    return {
      requestsPerMinute: APP_CONFIG.DEFAULT_KEY_LIMITS.REQUESTS_PER_MINUTE,
      requestsPerDay: APP_CONFIG.DEFAULT_KEY_LIMITS.REQUESTS_PER_DAY,
      isSharedKey: true,
    };
  }
  
  return {
    requestsPerMinute: modelConfig.maxRequestsPerMinute,
    requestsPerDay: modelConfig.maxRequestsPerDay,
    isSharedKey: false,
  };
}

// Get model configuration with fallback support
export function getModelConfig(preferredModel?: keyof typeof GEMINI_MODELS) {
  const model = preferredModel || GEMINI_CONFIG.DEFAULT_MODEL;
  return {
    model,
    config: GEMINI_MODELS[model],
    fallbackOrder: GEMINI_CONFIG.FALLBACK_ORDER,
  };
}

// Test if a model is available (for fallback logic)
export async function testModelAvailability(modelName: keyof typeof GEMINI_MODELS, apiKey: string): Promise<boolean> {
  try {
    const modelConfig = GEMINI_MODELS[modelName];
    const response = await fetch(`${modelConfig.url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'test' }] }]
      })
    });
    
    // Model is available if we don't get 404 or 403 (model not found/not accessible)
    return response.status !== 404 && response.status !== 403;
  } catch {
    return false;
  }
}