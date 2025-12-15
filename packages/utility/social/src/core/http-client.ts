import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';
import { rateLimiter } from './rate-limiter.js';
import { Platform, ApiResponse } from '../types/index.js';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOn: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: config.server.maxRetries,
  retryDelay: config.server.retryDelay,
  retryOn: [429, 500, 502, 503, 504],
};

interface HttpClientOptions {
  platform: Platform;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  retryConfig?: Partial<RetryConfig>;
  timeout?: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private platform: Platform;
  private retryConfig: RetryConfig;

  constructor(options: HttpClientOptions) {
    this.platform = options.platform;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };

    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout || config.server.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.defaultHeaders,
      },
    });

    // Response interceptor for rate limit headers
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimits(response);
        return response;
      },
      (error) => {
        if (error.response) {
          this.updateRateLimits(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimits(response: AxiosResponse): void {
    const endpoint = this.extractEndpoint(response.config.url || '');
    const headers: Record<string, string | undefined> = {};

    // Normalize headers (axios lowercases them)
    for (const [key, value] of Object.entries(response.headers)) {
      if (key.includes('rate') || key.includes('limit')) {
        headers[key] = String(value);
      }
    }

    if (Object.keys(headers).length > 0) {
      rateLimiter.updateFromHeaders(this.platform, endpoint, headers);
    }
  }

  private extractEndpoint(url: string): string {
    // Extract meaningful endpoint from URL
    const parts = url.split('/').filter(Boolean);
    return parts[0] || 'default';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, baseDelay: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 60000); // Max 60 seconds
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    endpoint: string
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError | Error | undefined;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check rate limits before making request
        await rateLimiter.checkAndWait(this.platform, endpoint);

        const response = await requestFn();
        return response;
      } catch (error) {
        lastError = error as AxiosError | Error;

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Check if we should retry
          if (status && this.retryConfig.retryOn.includes(status)) {
            if (attempt < this.retryConfig.maxRetries) {
              const delay = this.calculateBackoff(attempt, this.retryConfig.retryDelay);

              // Special handling for rate limits
              if (status === 429) {
                const retryAfter = error.response?.headers['retry-after'];
                const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
                logger.warn(`Rate limited (429), retrying in ${waitTime / 1000}s`, {
                  platform: this.platform,
                  tool: endpoint,
                });
                await this.sleep(waitTime);
              } else {
                logger.warn(`Request failed (${status}), retrying in ${delay / 1000}s (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`, {
                  platform: this.platform,
                  tool: endpoint,
                });
                await this.sleep(delay);
              }
              continue;
            }
          }
        }

        // Non-retryable error or max retries reached
        throw error;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const endpoint = this.extractEndpoint(url);

    try {
      const response = await this.executeWithRetry<T>(
        () => this.client.get<T>(url, config),
        endpoint
      );

      return {
        success: true,
        data: response.data,
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const endpoint = this.extractEndpoint(url);

    try {
      const response = await this.executeWithRetry<T>(
        () => this.client.post<T>(url, data, config),
        endpoint
      );

      return {
        success: true,
        data: response.data,
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const endpoint = this.extractEndpoint(url);

    try {
      const response = await this.executeWithRetry<T>(
        () => this.client.put<T>(url, data, config),
        endpoint
      );

      return {
        success: true,
        data: response.data,
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const endpoint = this.extractEndpoint(url);

    try {
      const response = await this.executeWithRetry<T>(
        () => this.client.delete<T>(url, config),
        endpoint
      );

      return {
        success: true,
        data: response.data,
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadFile<T = any>(
    url: string,
    file: Buffer,
    filename: string,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const endpoint = this.extractEndpoint(url);
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('file', file, { filename });

    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }
    }

    try {
      const response = await this.executeWithRetry<T>(
        () =>
          this.client.post<T>(url, formData, {
            headers: formData.getHeaders(),
          }),
        endpoint
      );

      return {
        success: true,
        data: response.data,
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      logger.error(`API error: ${error.message}`, {
        platform: this.platform,
        status,
      });

      return {
        success: false,
        error: {
          code: `HTTP_${status || 'UNKNOWN'}`,
          message: this.extractErrorMessage(data) || error.message,
          details: data,
        },
        metadata: {
          platform: this.platform,
          timestamp: new Date().toISOString(),
        },
      };
    }

    logger.error(`Unexpected error: ${error}`, { platform: this.platform });

    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
      metadata: {
        platform: this.platform,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private extractErrorMessage(data: any): string | undefined {
    if (!data) return undefined;

    // Different APIs return errors differently
    return (
      data.error?.message ||
      data.error_description ||
      data.message ||
      data.detail ||
      data.errors?.[0]?.message ||
      (typeof data.error === 'string' ? data.error : undefined)
    );
  }

  // Update authorization header
  setAuthHeader(token: string, type: 'Bearer' | 'OAuth' = 'Bearer'): void {
    this.client.defaults.headers.common['Authorization'] = `${type} ${token}`;
  }
}
