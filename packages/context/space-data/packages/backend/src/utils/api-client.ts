import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cache } from './cache';
import { APIResponse } from '@cosmic-atlas/shared';

/**
 * Base API client with caching and error handling
 */
export class APIClient {
  protected client: AxiosInstance;
  protected serviceName: string;
  protected defaultTTL: number;

  constructor(serviceName: string, baseURL: string, defaultTTL: number = 600) {
    this.serviceName = serviceName;
    this.defaultTTL = defaultTTL;

    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'User-Agent': 'Cosmic-Atlas/1.0',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[${this.serviceName}] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message;
        console.error(`[${this.serviceName}] Error:`, message);
        throw new Error(`${this.serviceName} API Error: ${message}`);
      }
    );
  }

  /**
   * Make cached GET request
   */
  public async cachedGet<T>(
    url: string,
    config?: AxiosRequestConfig,
    cacheKey?: string,
    ttl?: number
  ): Promise<APIResponse<T>> {
    const key = cacheKey || `${this.serviceName}:${url}:${JSON.stringify(config?.params || {})}`;

    // Check cache first
    const cached = cache.get<APIResponse<T>>(key);
    if (cached) {
      console.log(`[${this.serviceName}] Cache hit: ${key}`);
      return {
        ...cached,
        metadata: {
          ...cached.metadata!,
          cached: true,
        },
      };
    }

    // Make API request
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);

      const apiResponse: APIResponse<T> = {
        success: true,
        data: response.data,
        metadata: {
          source: this.serviceName,
          timestamp: Date.now(),
          cached: false,
          rateLimit: this.extractRateLimitInfo(response),
        },
      };

      // Cache the response
      cache.set(key, apiResponse, ttl || this.defaultTTL);

      return apiResponse;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          source: this.serviceName,
          timestamp: Date.now(),
          cached: false,
        },
      };
    }
  }

  /**
   * Make uncached GET request (for real-time data)
   */
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);

      return {
        success: true,
        data: response.data,
        metadata: {
          source: this.serviceName,
          timestamp: Date.now(),
          cached: false,
          rateLimit: this.extractRateLimitInfo(response),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          source: this.serviceName,
          timestamp: Date.now(),
          cached: false,
        },
      };
    }
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(response: AxiosResponse): {
    limit: number;
    remaining: number;
    reset: number;
  } | undefined {
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return undefined;
  }
}
