import NodeCache from 'node-cache';
import { config } from '../config';

/**
 * Cache manager with automatic TTL based on data type
 */
export class CacheManager {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      checkperiod: config.cache.checkPeriod,
    });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set cached value with TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 600); // Default 10 minutes
  }

  /**
   * Delete cached value
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }
}

export const cache = new CacheManager();
