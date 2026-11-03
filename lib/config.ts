export interface EnvironmentConfig {
  GEMINI_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production';
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Free-tier Gemini Developer API models, ordered by preference for food vision.
// Free tier quota: ~15 RPM / 1,500 RPD per project.
export const GEMINI_MODELS = {
  'gemini-3.8-flash': {
    url: `${GEMINI_API_BASE}/models/gemini-3.8-flash:generateContent`,
    label: 'Gemini 3.8 Flash',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 0, // Default - latest multimodal Flash model
  },
  'gemini-3.6-flash': {
    url: `${GEMINI_API_BASE}/models/gemini-3.6-flash:generateContent`,
    label: 'Gemini 3.6 Flash',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 1,
  },
  'gemini-3.5-flash-lite': {
    url: `${GEMINI_API_BASE}/models/gemini-3.5-flash-lite:generateContent`,
    label: 'Gemini 3.5 Flash-Lite',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 2,
  },
  'gemini-3.1-flash-lite': {
    url: `${GEMINI_API_BASE}/models/gemini-3.1-flash-lite:generateContent`,
    label: 'Gemini 3.1 Flash-Lite',
    maxRequestsPerMinute: 15,
    maxRequestsPerDay: 1500,
    priority: 3,
  },
  'gemini-2.5-pro': {
    // Legacy: free tier only for accounts that have used 2.5 before.
    url: `${GEMINI_API_BASE}/models/gemini-2.5-pro:generateContent`,
    label: 'Gemini 2.5 Pro',
    maxRequestsPerMinute: 5,
    maxRequestsPerDay: 100,
    priority: 4,
  },
} as const;

export type GeminiModelName = keyof typeof GEMINI_MODELS;

export const GEMINI_CONFIG = {
  MODELS: GEMINI_MODELS,
  API_BASE: GEMINI_API_BASE,
  DEFAULT_MODEL: 'gemini-3.8-flash',
  FALLBACK_ORDER: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'],
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  TIMEOUT: 30000, // 30 seconds
} as const;

// Build headers for Gemini API requests. The key goes in a header, not the URL,
// so it doesn't end up in proxy/server logs.
export function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
}

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
  USER_PROFILE: 'calorie_tracker_user_profile',
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

// Get API key: user-provided key takes precedence over the server env var.
export function getApiKey(userApiKey?: string): string {
  if (userApiKey && userApiKey.trim()) {
    return userApiKey.trim();
  }

  const config = getConfig();
  if (config.GEMINI_API_KEY) {
    return config.GEMINI_API_KEY;
  }

  throw new Error('No API key available. Please provide your Gemini API key in settings.');
}

// Get rate limits for a model
export function getRateLimits(_userApiKey?: string, modelName?: GeminiModelName) {
  const model = modelName || GEMINI_CONFIG.DEFAULT_MODEL;
  const modelConfig = GEMINI_MODELS[model];

  return {
    requestsPerMinute: modelConfig.maxRequestsPerMinute,
    requestsPerDay: modelConfig.maxRequestsPerDay,
  };
}

// Get model configuration with fallback support
export function getModelConfig(preferredModel?: GeminiModelName) {
  const model = preferredModel || GEMINI_CONFIG.DEFAULT_MODEL;
  return {
    model,
    config: GEMINI_MODELS[model],
    fallbackOrder: GEMINI_CONFIG.FALLBACK_ORDER,
  };
}
