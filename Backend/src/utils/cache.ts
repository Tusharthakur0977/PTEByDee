interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export const cache = new MemoryCache();

// Cache helper functions
export const getCachedData = <T>(key: string): T | null => {
  return cache.get<T>(key);
};

export const setCachedData = <T>(
  key: string,
  data: T,
  ttlSeconds: number = 300
): void => {
  cache.set(key, data, ttlSeconds);
};

export const deleteCachedData = (key: string): boolean => {
  return cache.delete(key);
};

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:${userId}`,
  COURSES: 'courses:all',
  COURSE_DETAIL: (courseId: string) => `course:${courseId}`,
  USER_COURSES: (userId: string) => `user:${userId}:courses`,
};
