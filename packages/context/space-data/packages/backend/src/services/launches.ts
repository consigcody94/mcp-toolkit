import { APIClient } from '../utils/api-client';
import { APIResponse, Launch } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * Launch Library 2 Client
 * Comprehensive rocket launch schedule from all providers
 * Rate limited to 15 requests per hour for free tier
 * @see https://ll.thespacedevs.com/2.2.0/
 */
export class LaunchClient extends APIClient {
  constructor() {
    // Use longer cache time (10 minutes) to respect rate limits
    super('LaunchLibrary', 'https://ll.thespacedevs.com/2.2.0', 600);
  }

  /**
   * Get upcoming launches from all providers
   * @param limit - Number of launches to return (default 10, max 100)
   * @param offset - Pagination offset (default 0)
   * @returns Paginated array of upcoming launches
   */
  async getUpcomingLaunches(
    limit: number = 10,
    offset: number = 0
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString(),
    };

    return this.cachedGet(
      '/launch/upcoming',
      { params },
      `launches-upcoming:${limit}:${offset}`,
      600 // 10 minutes cache due to rate limits
    );
  }

  /**
   * Get previous launches from all providers
   * @param limit - Number of launches to return (default 10, max 100)
   * @param offset - Pagination offset (default 0)
   * @returns Paginated array of past launches
   */
  async getPastLaunches(
    limit: number = 10,
    offset: number = 0
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString(),
    };

    return this.cachedGet(
      '/launch/previous',
      { params },
      `launches-previous:${limit}:${offset}`,
      config.cache.ttl.mars // Cache longer for historical data
    );
  }

  /**
   * Get specific launch by ID
   * @param id - Launch UUID
   * @returns Detailed launch information
   */
  async getLaunchById(id: string): Promise<APIResponse<Launch>> {
    return this.cachedGet<Launch>(
      `/launch/${id}`,
      { params: { mode: 'detailed' } },
      `launch:${id}`,
      config.cache.ttl.mars // Cache longer for specific launches
    );
  }

  /**
   * Search launches by query
   * @param query - Search string (searches name, location, rocket, etc.)
   * @param limit - Number of results to return (default 10)
   * @returns Array of matching launches
   */
  async searchLaunches(
    query: string,
    limit: number = 10
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      search: query,
      limit: Math.min(limit, 100).toString(),
    };

    return this.cachedGet(
      '/launch',
      { params },
      `launches-search:${query}:${limit}`,
      600 // 10 minutes cache
    );
  }

  /**
   * Get launches by launch service provider
   * @param lspId - Launch Service Provider ID
   * @param limit - Number of launches to return (default 10)
   * @returns Array of launches from specific provider
   */
  async getLaunchesByProvider(
    lspId: number,
    limit: number = 10
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      lsp__id: lspId.toString(),
      limit: Math.min(limit, 100).toString(),
    };

    return this.cachedGet(
      '/launch',
      { params },
      `launches-provider:${lspId}:${limit}`,
      600
    );
  }

  /**
   * Get launches by rocket
   * @param rocketId - Rocket configuration ID
   * @param limit - Number of launches to return (default 10)
   * @returns Array of launches using specific rocket
   */
  async getLaunchesByRocket(
    rocketId: number,
    limit: number = 10
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      rocket__configuration__id: rocketId.toString(),
      limit: Math.min(limit, 100).toString(),
    };

    return this.cachedGet(
      '/launch',
      { params },
      `launches-rocket:${rocketId}:${limit}`,
      600
    );
  }

  /**
   * Get launches by location
   * @param locationId - Launch location ID
   * @param limit - Number of launches to return (default 10)
   * @returns Array of launches from specific location
   */
  async getLaunchesByLocation(
    locationId: number,
    limit: number = 10
  ): Promise<APIResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Launch[];
  }>> {
    const params = {
      mode: 'detailed',
      location__id: locationId.toString(),
      limit: Math.min(limit, 100).toString(),
    };

    return this.cachedGet(
      '/launch',
      { params },
      `launches-location:${locationId}:${limit}`,
      600
    );
  }
}
