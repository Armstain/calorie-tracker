interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100; // Maximum number of entries

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Could implement hit rate tracking if needed
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new Cache();

export const cacheUtils = {
  getImageCacheKey(imageData: string): string {
    let hash = 0;
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `image_analysis_${Math.abs(hash)}`;
  },

  getWeeklyDataCacheKey(startDate: string): string {
    return `weekly_data_${startDate}`;
  },

  getDailyEntriesCacheKey(date: string): string {
    return `daily_entries_${date}`;
  },
};

if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}