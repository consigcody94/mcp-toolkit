import { APIClient } from '../utils/api-client';
import { APIResponse, SatellitePosition, VisualPass, TLE, Satellite } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * Satellite Tracking Client
 * Combines N2YO (primary) and CelesTrak (fallback) for satellite tracking
 */
export class SatelliteClient extends APIClient {
  private celestrakClient: APIClient;
  private hasN2YOKey: boolean;

  constructor() {
    super('N2YO', 'https://api.n2yo.com/rest/v1/satellite', config.cache.ttl.satellite);
    this.celestrakClient = new APIClient('CelesTrak', 'https://celestrak.org', config.cache.ttl.satellite);
    this.hasN2YOKey = !!config.apiKeys.n2yo;
  }

  /**
   * Get real-time satellite position
   * @param noradId - NORAD catalog ID
   * @param lat - Observer latitude (-90 to 90)
   * @param lon - Observer longitude (-180 to 180)
   * @param alt - Observer altitude in meters
   * @param seconds - Number of seconds for prediction (1-300)
   * @returns Array of satellite positions
   */
  async getPosition(
    noradId: number,
    lat: number,
    lon: number,
    alt: number,
    seconds: number = 1
  ): Promise<APIResponse<{
    info: {
      satname: string;
      satid: number;
      transactionscount: number;
    };
    positions: Array<{
      satlatitude: number;
      satlongitude: number;
      sataltitude: number;
      azimuth: number;
      elevation: number;
      ra: number;
      dec: number;
      timestamp: number;
    }>;
  }>> {
    if (!this.hasN2YOKey) {
      return {
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: 'N2YO API key required for satellite position tracking. Set N2YO_API_KEY environment variable.',
        },
        metadata: {
          source: 'N2YO',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return this.cachedGet(
      `/positions/${noradId}/${lat}/${lon}/${alt}/${seconds}`,
      {
        params: { apiKey: config.apiKeys.n2yo },
      },
      `satellite-pos:${noradId}:${lat}:${lon}:${seconds}`,
      config.cache.ttl.satellite
    );
  }

  /**
   * Get visual passes (when satellite is visible from location)
   * @param noradId - NORAD catalog ID
   * @param lat - Observer latitude
   * @param lon - Observer longitude
   * @param alt - Observer altitude in meters
   * @param days - Number of days to predict (1-10)
   * @param minVisibility - Minimum seconds of visibility (default 300)
   * @returns Array of visual pass predictions
   */
  async getVisualPasses(
    noradId: number,
    lat: number,
    lon: number,
    alt: number,
    days: number = 10,
    minVisibility: number = 300
  ): Promise<APIResponse<{
    info: {
      satname: string;
      satid: number;
      passescount: number;
    };
    passes: Array<{
      startAz: number;
      startAzCompass: string;
      startEl: number;
      startUTC: number;
      maxAz: number;
      maxAzCompass: string;
      maxEl: number;
      maxUTC: number;
      endAz: number;
      endAzCompass: string;
      endEl: number;
      endUTC: number;
      mag: number;
      duration: number;
    }>;
  }>> {
    if (!this.hasN2YOKey) {
      return {
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: 'N2YO API key required for visual pass predictions. Set N2YO_API_KEY environment variable.',
        },
        metadata: {
          source: 'N2YO',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return this.cachedGet(
      `/visualpasses/${noradId}/${lat}/${lon}/${alt}/${days}/${minVisibility}`,
      {
        params: { apiKey: config.apiKeys.n2yo },
      },
      `satellite-passes:${noradId}:${lat}:${lon}:${days}`,
      config.cache.ttl.satellite * 10 // Cache longer for passes
    );
  }

  /**
   * Get Two-Line Element (TLE) data
   * @param noradId - NORAD catalog ID
   * @returns TLE data for orbital calculations
   */
  async getTLE(noradId: number): Promise<APIResponse<{
    info: {
      satname: string;
      satid: number;
    };
    tle: string;
  }>> {
    if (!this.hasN2YOKey) {
      // Fallback to CelesTrak
      const celestrakResult = await this.getCelesTrakTLE(noradId.toString());
      if (!celestrakResult.success) {
        return celestrakResult as any;
      }
      // Wrap the raw TLE string in the expected format
      return {
        success: true,
        data: {
          info: {
            satname: `Satellite ${noradId}`,
            satid: noradId,
          },
          tle: celestrakResult.data || '',
        },
        metadata: celestrakResult.metadata,
      };
    }

    return this.cachedGet(
      `/tle/${noradId}`,
      {
        params: { apiKey: config.apiKeys.n2yo },
      },
      `satellite-tle:${noradId}`,
      config.cache.ttl.satellite * 60 // TLE changes slowly, cache for 1 hour
    );
  }

  /**
   * Get satellites above a location
   * @param lat - Observer latitude
   * @param lon - Observer longitude
   * @param alt - Observer altitude in meters
   * @param radius - Search radius in degrees (0-90)
   * @param category - Optional category ID (0=all, 1=Amateur, 2=Weather, etc.)
   * @returns Array of satellites currently above the location
   */
  async getSatellitesAbove(
    lat: number,
    lon: number,
    alt: number,
    radius: number,
    category: number = 0
  ): Promise<APIResponse<{
    info: {
      category: string;
      transactionscount: number;
      satcount: number;
    };
    above: Array<{
      satid: number;
      satname: string;
      intDesignator: string;
      launchDate: string;
      satlat: number;
      satlng: number;
      satalt: number;
    }>;
  }>> {
    if (!this.hasN2YOKey) {
      return {
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: 'N2YO API key required for satellites above location. Set N2YO_API_KEY environment variable.',
        },
        metadata: {
          source: 'N2YO',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return this.cachedGet(
      `/above/${lat}/${lon}/${alt}/${radius}/${category}`,
      {
        params: { apiKey: config.apiKeys.n2yo },
      },
      `satellites-above:${lat}:${lon}:${radius}:${category}`,
      config.cache.ttl.satellite
    );
  }

  /**
   * Get TLE from CelesTrak (fallback when N2YO unavailable)
   * @param catnr - Catalog number (NORAD ID as string)
   * @returns TLE data in text format
   */
  async getCelesTrakTLE(catnr: string): Promise<APIResponse<string>> {
    return this.celestrakClient.cachedGet<string>(
      '/NORAD/elements/gp.php',
      {
        params: {
          CATNR: catnr,
          FORMAT: 'TLE',
        },
      },
      `celestrak-tle:${catnr}`,
      config.cache.ttl.satellite * 60 // Cache for 1 hour
    );
  }
}
