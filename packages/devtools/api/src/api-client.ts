/**
 * API Client for making HTTP requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  HTTPRequest,
  HTTPResponse,
  APIRequest,
  APICollection,
  OperationResult,
} from './types.js';

export class APIClient {
  private axiosInstance: AxiosInstance;
  private collections: Map<string, APICollection> = new Map();

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Make an HTTP request
   */
  async makeRequest(request: HTTPRequest): Promise<HTTPResponse> {
    const startTime = Date.now();

    try {
      const config: AxiosRequestConfig = {
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        params: request.query,
        data: request.body,
      };

      const response: AxiosResponse = await this.axiosInstance.request(config);
      const duration = Date.now() - startTime;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        body: response.data,
        duration,
      };
    } catch (error) {
      throw new Error(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new API collection
   */
  createCollection(
    name: string,
    description?: string,
    baseUrl?: string
  ): OperationResult {
    const id = `collection-${Date.now()}`;
    const collection: APICollection = {
      id,
      name,
      description,
      baseUrl,
      requests: [],
      variables: {},
    };

    this.collections.set(id, collection);

    return {
      success: true,
      message: 'Collection created',
      data: { id, name },
    };
  }

  /**
   * Add a request to a collection
   */
  addRequestToCollection(
    collectionId: string,
    request: Omit<APIRequest, 'id'>
  ): OperationResult {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      return {
        success: false,
        message: 'Collection not found',
        error: `Collection ${collectionId} does not exist`,
      };
    }

    const requestId = `request-${Date.now()}`;
    const fullRequest: APIRequest = {
      id: requestId,
      ...request,
    };

    collection.requests.push(fullRequest);

    return {
      success: true,
      message: 'Request added to collection',
      data: { requestId, name: request.name },
    };
  }

  /**
   * Execute a request from a collection
   */
  async executeCollectionRequest(
    collectionId: string,
    requestId: string
  ): Promise<HTTPResponse> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const request = collection.requests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found in collection`);
    }

    // Replace variables in URL
    let url = request.url;
    if (collection.baseUrl && !url.startsWith('http')) {
      url = `${collection.baseUrl}${url}`;
    }

    if (collection.variables) {
      Object.entries(collection.variables).forEach(([key, value]) => {
        url = url.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Build HTTP request
    const httpRequest: HTTPRequest = {
      method: request.method,
      url,
      headers: request.headers || {},
      body: request.body,
      query: request.query,
    };

    // Add authentication
    if (request.auth) {
      switch (request.auth.type) {
        case 'bearer':
          if (request.auth.token) {
            httpRequest.headers!['Authorization'] = `Bearer ${request.auth.token}`;
          }
          break;
        case 'basic':
          if (request.auth.username && request.auth.password) {
            const credentials = Buffer.from(
              `${request.auth.username}:${request.auth.password}`
            ).toString('base64');
            httpRequest.headers!['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'api-key':
          if (request.auth.apiKey && request.auth.apiKeyHeader) {
            httpRequest.headers![request.auth.apiKeyHeader] = request.auth.apiKey;
          }
          break;
      }
    }

    return this.makeRequest(httpRequest);
  }

  /**
   * List all collections
   */
  listCollections(): APICollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Get a specific collection
   */
  getCollection(collectionId: string): APICollection | null {
    return this.collections.get(collectionId) || null;
  }

  /**
   * Delete a collection
   */
  deleteCollection(collectionId: string): OperationResult {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      return {
        success: false,
        message: 'Collection not found',
        error: `Collection ${collectionId} does not exist`,
      };
    }

    this.collections.delete(collectionId);

    return {
      success: true,
      message: 'Collection deleted',
    };
  }

  /**
   * Set a variable in a collection
   */
  setCollectionVariable(
    collectionId: string,
    key: string,
    value: string
  ): OperationResult {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      return {
        success: false,
        message: 'Collection not found',
        error: `Collection ${collectionId} does not exist`,
      };
    }

    if (!collection.variables) {
      collection.variables = {};
    }

    collection.variables[key] = value;

    return {
      success: true,
      message: 'Variable set',
      data: { key, value },
    };
  }
}
