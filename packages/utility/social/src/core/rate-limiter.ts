import { Platform, RateLimitInfo } from '../types/index.js';
import { logger } from './logger.js';

interface RateLimitEntry {
  limit: number;
  remaining: number;
  resetAt: Date;
  lastUpdated: Date;
}

interface RateLimitConfig {
  requestsPerWindow: number;
  windowMs: number;
}

// Default rate limits per platform (conservative estimates)
const DEFAULT_LIMITS: Record<Platform, Record<string, RateLimitConfig>> = {
  twitter: {
    tweets: { requestsPerWindow: 200, windowMs: 15 * 60 * 1000 }, // 200 per 15 min
    'tweets:create': { requestsPerWindow: 200, windowMs: 24 * 60 * 60 * 1000 }, // 200 per day (free tier: 50)
    users: { requestsPerWindow: 900, windowMs: 15 * 60 * 1000 },
    default: { requestsPerWindow: 300, windowMs: 15 * 60 * 1000 },
  },
  linkedin: {
    posts: { requestsPerWindow: 100, windowMs: 24 * 60 * 60 * 1000 },
    shares: { requestsPerWindow: 25, windowMs: 24 * 60 * 60 * 1000 },
    default: { requestsPerWindow: 100, windowMs: 60 * 1000 },
  },
  facebook: {
    posts: { requestsPerWindow: 25, windowMs: 60 * 60 * 1000 },
    pages: { requestsPerWindow: 200, windowMs: 60 * 60 * 1000 },
    default: { requestsPerWindow: 200, windowMs: 60 * 60 * 1000 },
  },
  instagram: {
    posts: { requestsPerWindow: 25, windowMs: 24 * 60 * 60 * 1000 },
    stories: { requestsPerWindow: 100, windowMs: 24 * 60 * 60 * 1000 },
    default: { requestsPerWindow: 200, windowMs: 60 * 60 * 1000 },
  },
  tiktok: {
    posts: { requestsPerWindow: 10, windowMs: 24 * 60 * 60 * 1000 },
    default: { requestsPerWindow: 100, windowMs: 60 * 1000 },
  },
  youtube: {
    uploads: { requestsPerWindow: 6, windowMs: 24 * 60 * 60 * 1000 },
    default: { requestsPerWindow: 10000, windowMs: 24 * 60 * 60 * 1000 }, // quota units
  },
  threads: {
    posts: { requestsPerWindow: 250, windowMs: 24 * 60 * 60 * 1000 },
    default: { requestsPerWindow: 200, windowMs: 60 * 60 * 1000 },
  },
};

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private requestQueue: Map<string, Promise<void>> = new Map();

  private getKey(platform: Platform, endpoint: string): string {
    return `${platform}:${endpoint}`;
  }

  private getDefaultConfig(platform: Platform, endpoint: string): RateLimitConfig {
    const platformLimits = DEFAULT_LIMITS[platform] || { default: { requestsPerWindow: 60, windowMs: 60 * 1000 } };
    return platformLimits[endpoint] || platformLimits.default;
  }

  private initializeEntry(platform: Platform, endpoint: string): RateLimitEntry {
    const config = this.getDefaultConfig(platform, endpoint);
    return {
      limit: config.requestsPerWindow,
      remaining: config.requestsPerWindow,
      resetAt: new Date(Date.now() + config.windowMs),
      lastUpdated: new Date(),
    };
  }

  /**
   * Update rate limit info from API response headers
   */
  updateFromHeaders(
    platform: Platform,
    endpoint: string,
    headers: Record<string, string | undefined>
  ): void {
    const key = this.getKey(platform, endpoint);
    const entry = this.limits.get(key) || this.initializeEntry(platform, endpoint);

    // Different platforms use different header names
    const remaining =
      headers['x-rate-limit-remaining'] ||
      headers['x-ratelimit-remaining'] ||
      headers['x-app-rate-limit-remaining'];
    const limit =
      headers['x-rate-limit-limit'] ||
      headers['x-ratelimit-limit'] ||
      headers['x-app-rate-limit-limit'];
    const reset =
      headers['x-rate-limit-reset'] ||
      headers['x-ratelimit-reset'] ||
      headers['x-app-rate-limit-reset'];

    if (remaining !== undefined) {
      entry.remaining = parseInt(remaining, 10);
    }
    if (limit !== undefined) {
      entry.limit = parseInt(limit, 10);
    }
    if (reset !== undefined) {
      // Some APIs return unix timestamp, others return seconds until reset
      const resetValue = parseInt(reset, 10);
      entry.resetAt = resetValue > 1000000000
        ? new Date(resetValue * 1000)
        : new Date(Date.now() + resetValue * 1000);
    }

    entry.lastUpdated = new Date();
    this.limits.set(key, entry);

    logger.debug(`Rate limit updated: ${entry.remaining}/${entry.limit} remaining`, {
      platform,
      tool: endpoint,
    });
  }

  /**
   * Check if we can make a request, and wait if necessary
   */
  async checkAndWait(platform: Platform, endpoint: string): Promise<void> {
    const key = this.getKey(platform, endpoint);

    // Queue requests to prevent race conditions
    const existingQueue = this.requestQueue.get(key);
    if (existingQueue) {
      await existingQueue;
    }

    const queuePromise = this.processRateLimit(platform, endpoint, key);
    this.requestQueue.set(key, queuePromise);

    try {
      await queuePromise;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  private async processRateLimit(
    platform: Platform,
    endpoint: string,
    key: string
  ): Promise<void> {
    let entry = this.limits.get(key);

    // Initialize if not exists
    if (!entry) {
      entry = this.initializeEntry(platform, endpoint);
      this.limits.set(key, entry);
    }

    // Check if window has reset
    if (new Date() >= entry.resetAt) {
      const config = this.getDefaultConfig(platform, endpoint);
      entry.remaining = config.requestsPerWindow;
      entry.resetAt = new Date(Date.now() + config.windowMs);
      entry.lastUpdated = new Date();
    }

    // If no remaining requests, wait for reset
    if (entry.remaining <= 0) {
      const waitTime = entry.resetAt.getTime() - Date.now();
      if (waitTime > 0) {
        logger.warn(`Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s`, {
          platform,
          tool: endpoint,
        });
        await this.sleep(waitTime);

        // Reset after waiting
        const config = this.getDefaultConfig(platform, endpoint);
        entry.remaining = config.requestsPerWindow;
        entry.resetAt = new Date(Date.now() + config.windowMs);
      }
    }

    // Decrement remaining
    entry.remaining--;
    entry.lastUpdated = new Date();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status for a platform/endpoint
   */
  getStatus(platform: Platform, endpoint: string): RateLimitInfo {
    const key = this.getKey(platform, endpoint);
    const entry = this.limits.get(key) || this.initializeEntry(platform, endpoint);

    return {
      platform,
      endpoint,
      limit: entry.limit,
      remaining: entry.remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get all rate limit statuses
   */
  getAllStatuses(): RateLimitInfo[] {
    const statuses: RateLimitInfo[] = [];

    for (const [key, entry] of this.limits) {
      const [platform, endpoint] = key.split(':') as [Platform, string];
      statuses.push({
        platform,
        endpoint,
        limit: entry.limit,
        remaining: entry.remaining,
        resetAt: entry.resetAt,
      });
    }

    return statuses;
  }

  /**
   * Manually set rate limit (useful for testing or manual overrides)
   */
  setLimit(platform: Platform, endpoint: string, remaining: number, resetAt: Date): void {
    const key = this.getKey(platform, endpoint);
    const entry = this.limits.get(key) || this.initializeEntry(platform, endpoint);

    entry.remaining = remaining;
    entry.resetAt = resetAt;
    entry.lastUpdated = new Date();

    this.limits.set(key, entry);
  }
}

export const rateLimiter = new RateLimiter();
