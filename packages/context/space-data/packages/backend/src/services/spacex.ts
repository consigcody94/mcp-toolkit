import { APIClient } from '../utils/api-client';
import { APIResponse, StarlinkSatellite } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * SpaceX Data Client
 * Access to SpaceX launches, rockets, capsules, and Starlink satellites
 * Uses SpaceX API v5 (no authentication required)
 * @see https://github.com/r-spacex/SpaceX-API
 */
export class SpaceXClient extends APIClient {
  constructor() {
    super('SpaceX', 'https://api.spacexdata.com/v5', config.cache.ttl.launch);
  }

  /**
   * Get most recent SpaceX launch
   * @returns Latest launch data
   */
  async getLatestLaunch(): Promise<APIResponse<{
    id: string;
    name: string;
    date_utc: string;
    date_unix: number;
    date_local: string;
    date_precision: string;
    upcoming: boolean;
    rocket: string;
    success: boolean | null;
    details: string | null;
    crew: string[];
    ships: string[];
    capsules: string[];
    payloads: string[];
    launchpad: string;
    flight_number: number;
    links: {
      patch: {
        small: string | null;
        large: string | null;
      };
      reddit: {
        campaign: string | null;
        launch: string | null;
        media: string | null;
        recovery: string | null;
      };
      flickr: {
        small: string[];
        original: string[];
      };
      presskit: string | null;
      webcast: string | null;
      youtube_id: string | null;
      article: string | null;
      wikipedia: string | null;
    };
  }>> {
    return this.cachedGet(
      '/launches/latest',
      {},
      'spacex-latest',
      config.cache.ttl.launch
    );
  }

  /**
   * Get next SpaceX launch
   * @returns Upcoming launch data
   */
  async getNextLaunch(): Promise<APIResponse<any>> {
    return this.cachedGet(
      '/launches/next',
      {},
      'spacex-next',
      config.cache.ttl.launch
    );
  }

  /**
   * Get upcoming SpaceX launches
   * @param limit - Number of launches to return (default 10)
   * @returns Array of upcoming launches
   */
  async getUpcomingLaunches(limit: number = 10): Promise<APIResponse<any[]>> {
    return this.cachedGet(
      '/launches/upcoming',
      {
        params: {
          limit: limit.toString(),
        },
      },
      `spacex-upcoming:${limit}`,
      config.cache.ttl.launch
    );
  }

  /**
   * Get all SpaceX rockets
   * @returns Array of rocket configurations
   */
  async getRockets(): Promise<APIResponse<Array<{
    id: string;
    name: string;
    type: string;
    active: boolean;
    stages: number;
    boosters: number;
    cost_per_launch: number;
    success_rate_pct: number;
    first_flight: string;
    country: string;
    company: string;
    height: {
      meters: number;
      feet: number;
    };
    diameter: {
      meters: number;
      feet: number;
    };
    mass: {
      kg: number;
      lb: number;
    };
    payload_weights: Array<{
      id: string;
      name: string;
      kg: number;
      lb: number;
    }>;
    first_stage: {
      reusable: boolean;
      engines: number;
      fuel_amount_tons: number;
      burn_time_sec: number;
      thrust_sea_level: {
        kN: number;
        lbf: number;
      };
      thrust_vacuum: {
        kN: number;
        lbf: number;
      };
    };
    second_stage: {
      reusable: boolean;
      engines: number;
      fuel_amount_tons: number;
      burn_time_sec: number;
      thrust: {
        kN: number;
        lbf: number;
      };
      payloads: {
        option_1: string;
        composite_fairing: {
          height: {
            meters: number;
            feet: number;
          };
          diameter: {
            meters: number;
            feet: number;
          };
        };
      };
    };
    engines: {
      number: number;
      type: string;
      version: string;
      layout: string;
      engine_loss_max: number;
      propellant_1: string;
      propellant_2: string;
      thrust_sea_level: {
        kN: number;
        lbf: number;
      };
      thrust_vacuum: {
        kN: number;
        lbf: number;
      };
      thrust_to_weight: number;
    };
    landing_legs: {
      number: number;
      material: string;
    };
    flickr_images: string[];
    wikipedia: string;
    description: string;
  }>>> {
    return this.cachedGet(
      '/rockets',
      {},
      'spacex-rockets',
      config.cache.ttl.mars // Rockets data is relatively static
    );
  }

  /**
   * Get Starlink satellites
   * @param limit - Number of satellites to return (default 50, max 500)
   * @returns Array of Starlink satellite data
   */
  async getStarlink(limit: number = 50): Promise<APIResponse<StarlinkSatellite[]>> {
    return this.cachedGet<StarlinkSatellite[]>(
      '/starlink',
      {
        params: {
          limit: Math.min(limit, 500).toString(),
        },
      },
      `spacex-starlink:${limit}`,
      config.cache.ttl.satellite
    );
  }

  /**
   * Get SpaceX capsules
   * @returns Array of Dragon capsule data
   */
  async getCapsules(): Promise<APIResponse<Array<{
    id: string;
    serial: string;
    status: string;
    type: string;
    dragon: string;
    reuse_count: number;
    water_landings: number;
    land_landings: number;
    last_update: string | null;
    launches: string[];
  }>>> {
    return this.cachedGet(
      '/capsules',
      {},
      'spacex-capsules',
      config.cache.ttl.launch
    );
  }

  /**
   * Get SpaceX launchpads
   * @returns Array of launchpad data
   */
  async getLaunchpads(): Promise<APIResponse<Array<{
    id: string;
    name: string;
    full_name: string;
    status: string;
    locality: string;
    region: string;
    latitude: number;
    longitude: number;
    launch_attempts: number;
    launch_successes: number;
    rockets: string[];
    launches: string[];
    details: string;
  }>>> {
    return this.cachedGet(
      '/launchpads',
      {},
      'spacex-launchpads',
      config.cache.ttl.mars // Launchpad data is relatively static
    );
  }
}
