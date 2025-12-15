import { APIClient } from '../utils/api-client';
import { APIResponse, ISSLocation, Astronaut, ISSPassPrediction } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * International Space Station Client
 * Real-time ISS tracking and astronaut information
 * Uses Open Notify API (no authentication required)
 * @see http://open-notify.org/
 */
export class ISSClient extends APIClient {
  constructor() {
    super('ISS', 'http://api.open-notify.org', config.cache.ttl.iss);
  }

  /**
   * Get current ISS position
   * Real-time location updated every few seconds
   * @returns Current ISS latitude, longitude, and timestamp
   */
  async getCurrentPosition(): Promise<APIResponse<{
    timestamp: number;
    message: string;
    iss_position: {
      latitude: string;
      longitude: string;
    };
  }>> {
    return this.cachedGet(
      '/iss-now.json',
      {},
      'iss-position',
      config.cache.ttl.iss // Very short cache (5 seconds)
    );
  }

  /**
   * Get ISS pass times for a location
   * Predicts when ISS will be visible from a specific location
   * @param lat - Observer latitude (-90 to 90)
   * @param lon - Observer longitude (-180 to 180)
   * @param alt - Observer altitude in meters (default 0)
   * @param n - Number of passes to return (default 5, max 100)
   * @returns Array of upcoming ISS pass times
   */
  async getPassTimes(
    lat: number,
    lon: number,
    alt: number = 0,
    n: number = 5
  ): Promise<APIResponse<{
    message: string;
    request: {
      altitude: number;
      datetime: number;
      latitude: number;
      longitude: number;
      passes: number;
    };
    response: Array<{
      duration: number;
      risetime: number;
    }>;
  }>> {
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      alt: alt.toString(),
      n: n.toString(),
    };

    return this.cachedGet(
      '/iss-pass.json',
      { params },
      `iss-passes:${lat}:${lon}:${alt}:${n}`,
      config.cache.ttl.satellite * 10 // Cache for 10 minutes (passes don't change rapidly)
    );
  }

  /**
   * Get list of people currently in space
   * Includes ISS crew and other spacecraft
   * @returns Array of astronauts with name and craft
   */
  async getAstronauts(): Promise<APIResponse<{
    message: string;
    number: number;
    people: Array<{
      name: string;
      craft: string;
    }>;
  }>> {
    return this.cachedGet(
      '/astros.json',
      {},
      'astronauts',
      config.cache.ttl.spaceWeather // Cache for 5 minutes (crew changes are rare)
    );
  }

  /**
   * Enhanced ISS position with calculated metadata
   * Extends basic position with velocity, footprint, and visibility
   * @returns Enhanced ISS location data
   */
  async getEnhancedPosition(): Promise<APIResponse<ISSLocation>> {
    const response = await this.getCurrentPosition();

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to get ISS position',
        },
        metadata: response.metadata,
      };
    }

    const { iss_position, timestamp } = response.data;
    const latitude = parseFloat(iss_position.latitude);
    const longitude = parseFloat(iss_position.longitude);

    // ISS orbits at approximately 408 km altitude at 7.66 km/s
    const issAltitude = 408;
    const issVelocity = 7.66;

    // Calculate visibility footprint (horizon distance)
    const earthRadius = 6371; // km
    const footprint = Math.sqrt(
      Math.pow(earthRadius + issAltitude, 2) - Math.pow(earthRadius, 2)
    );

    // Simple day/night calculation based on longitude
    // More accurate would use sun position, but this is approximate
    const sunLongitude = ((timestamp / 1000 - 43200) / 86400) * 360 - 180;
    const longitudeDiff = Math.abs(longitude - sunLongitude);
    const visibility = longitudeDiff < 90 || longitudeDiff > 270 ? 'daylight' : 'eclipse';

    const enhancedData: ISSLocation = {
      latitude,
      longitude,
      altitude: issAltitude,
      velocity: issVelocity,
      timestamp: timestamp * 1000, // Convert to milliseconds
      visibility,
      footprint: Math.round(footprint),
    };

    return {
      success: true,
      data: enhancedData,
      metadata: response.metadata,
    };
  }
}
