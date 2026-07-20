/**
 * Zero-dependency In-Memory Cache with TTL and Key Pattern Invalidation.
 * Optimized for Render Free Tier (low memory footprint, fast lookups).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get a cached item. Returns undefined if missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a cached item with TTL in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific cache key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. 'reports:*', 'settings:*')
   */
  invalidatePattern(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new SimpleMemoryCache();
