import { APIClient } from '../utils/api-client';
import { APIResponse, NaturalEvent, EarthImagery } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * Earth Observation Client
 * NASA EONET (Earth Observatory Natural Event Tracker) for natural events
 * Landsat imagery and environmental data
 */
export class EarthClient extends APIClient {
  private imageryClient: APIClient;

  constructor() {
    super('EONET', 'https://eonet.gsfc.nasa.gov/api/v3', config.cache.ttl.earth);
    this.imageryClient = new APIClient('NASA-Earth', 'https://api.nasa.gov', config.cache.ttl.earth);
  }

  /**
   * Get natural events from EONET
   * Tracks wildfires, storms, volcanoes, floods, etc.
   * @param category - Optional category filter (wildfires, volcanoes, storms, floods, drought, dustHaze, snow, landslides, seaLakeIce, earthquakes, severeStorms)
   * @param status - Optional status filter (open, closed, all)
   * @param days - Optional number of days to look back (default 20)
   * @returns Array of natural events with geometry and sources
   */
  async getNaturalEvents(
    category?: string,
    status: string = 'open',
    days: number = 20
  ): Promise<APIResponse<{
    title: string;
    description: string;
    link: string;
    events: NaturalEvent[];
  }>> {
    const params: Record<string, string | number> = {
      status,
      days,
    };

    if (category) {
      params.category = category;
    }

    return this.cachedGet(
      '/events',
      { params },
      `events:${category || 'all'}:${status}:${days}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get specific event by ID
   * @param id - Event ID (e.g., "EONET_5920")
   * @returns Detailed event information with full geometry timeline
   */
  async getEventById(id: string): Promise<APIResponse<NaturalEvent>> {
    return this.cachedGet<NaturalEvent>(
      `/events/${id}`,
      {},
      `event:${id}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get event categories
   * @returns List of all available event categories
   */
  async getCategories(): Promise<APIResponse<{
    title: string;
    description: string;
    link: string;
    categories: Array<{
      id: string;
      title: string;
      link: string;
      description: string;
      layers: string;
    }>;
  }>> {
    return this.cachedGet(
      '/categories',
      {},
      'categories',
      config.cache.ttl.mars // Cache longer, categories don't change often
    );
  }

  /**
   * Get events by category
   * @param categoryId - Category ID (e.g., "wildfires", "volcanoes")
   * @param status - Optional status filter (open, closed, all)
   * @param limit - Optional limit on number of events
   * @returns Events filtered by category
   */
  async getEventsByCategory(
    categoryId: string,
    status: string = 'open',
    limit?: number
  ): Promise<APIResponse<{
    title: string;
    description: string;
    link: string;
    events: NaturalEvent[];
  }>> {
    const params: Record<string, string | number> = {
      status,
    };

    if (limit) {
      params.limit = limit;
    }

    return this.cachedGet(
      `/categories/${categoryId}`,
      { params },
      `category:${categoryId}:${status}:${limit || 'all'}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get Earth imagery from Landsat 8
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @param date - Optional date (YYYY-MM-DD). Defaults to most recent available
   * @param dim - Image dimension (0.025 to 0.5, default 0.025)
   * @param cloudScore - Request cloud score (true/false, default false)
   * @returns Earth imagery URL and metadata
   */
  async getEarthImagery(
    lat: number,
    lon: number,
    date?: string,
    dim: number = 0.025,
    cloudScore: boolean = false
  ): Promise<APIResponse<{
    date: string;
    id: string;
    url: string;
    resource: {
      dataset: string;
      planet: string;
    };
    cloud_score?: number;
  }>> {
    const params: Record<string, string | number | boolean> = {
      api_key: config.apiKeys.nasa,
      lat,
      lon,
      dim,
      cloud_score: cloudScore,
    };

    if (date) {
      params.date = date;
    }

    return this.imageryClient.cachedGet(
      '/planetary/earth/imagery',
      { params },
      `earth-image:${lat}:${lon}:${date || 'latest'}:${dim}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get Earth assets (available dates for location)
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @param begin - Optional start date (YYYY-MM-DD)
   * @param end - Optional end date (YYYY-MM-DD)
   * @returns Available Landsat imagery dates for location
   */
  async getEarthAssets(
    lat: number,
    lon: number,
    begin?: string,
    end?: string
  ): Promise<APIResponse<{
    count: number;
    results: Array<{
      date: string;
      id: string;
    }>;
  }>> {
    const params: Record<string, string | number> = {
      api_key: config.apiKeys.nasa,
      lat,
      lon,
    };

    if (begin) {
      params.begin = begin;
    }
    if (end) {
      params.end = end;
    }

    return this.imageryClient.cachedGet(
      '/planetary/earth/assets',
      { params },
      `earth-assets:${lat}:${lon}:${begin || 'all'}:${end || 'all'}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get wildfire events
   * Convenience method for filtering wildfires
   * @param days - Number of days to look back (default 7)
   * @returns Active wildfire events
   */
  async getWildfires(days: number = 7): Promise<APIResponse<any>> {
    return this.getNaturalEvents('wildfires', 'open', days);
  }

  /**
   * Get volcanic activity
   * Convenience method for filtering volcanic events
   * @param days - Number of days to look back (default 30)
   * @returns Active volcanic events
   */
  async getVolcanicActivity(days: number = 30): Promise<APIResponse<any>> {
    return this.getNaturalEvents('volcanoes', 'open', days);
  }

  /**
   * Get severe storm events
   * Convenience method for filtering storms
   * @param days - Number of days to look back (default 7)
   * @returns Active severe storm events
   */
  async getSevereStorms(days: number = 7): Promise<APIResponse<any>> {
    return this.getNaturalEvents('severeStorms', 'open', days);
  }
}
