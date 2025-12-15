import { APIClient } from '../utils/api-client';
import { APIResponse, Ephemeris } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * Solar System Client
 * JPL HORIZONS API for ephemeris data and SBDB for small body database
 * @see https://ssd.jpl.nasa.gov/horizons/
 * @see https://ssd-api.jpl.nasa.gov/doc/
 */
export class SolarSystemClient extends APIClient {
  private sbdbClient: APIClient;
  private fireballs: APIClient;

  constructor() {
    super('JPL-HORIZONS', 'https://ssd.jpl.nasa.gov/api/horizons.api', config.cache.ttl.earth);
    this.sbdbClient = new APIClient('JPL-SBDB', 'https://ssd-api.jpl.nasa.gov', config.cache.ttl.earth);
    this.fireballs = new APIClient('JPL-Fireballs', 'https://ssd-api.jpl.nasa.gov', config.cache.ttl.earth);
  }

  /**
   * Get ephemeris data from JPL HORIZONS
   * Provides position and velocity vectors for solar system bodies
   * @param body - Body identifier (e.g., "499" for Mars, "10" for Sun, "301" for Moon)
   * @param startTime - Start time (ISO 8601 or Julian date)
   * @param stopTime - Stop time
   * @param stepSize - Step size (e.g., "1d" for 1 day, "1h" for 1 hour)
   * @returns Ephemeris data with position and velocity vectors
   */
  async getEphemeris(
    body: string,
    startTime: string,
    stopTime: string,
    stepSize: string = '1d'
  ): Promise<APIResponse<any>> {
    const params = {
      format: 'json',
      COMMAND: `'${body}'`,
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: '500@399', // Earth center
      START_TIME: `'${startTime}'`,
      STOP_TIME: `'${stopTime}'`,
      STEP_SIZE: `'${stepSize}'`,
      VEC_TABLE: '2', // State vectors (position + velocity)
    };

    return this.cachedGet(
      '',
      { params },
      `ephemeris:${body}:${startTime}:${stopTime}:${stepSize}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get planet position at specific date
   * Simplified interface for getting current planet positions
   * @param planet - Planet name (mercury, venus, mars, jupiter, saturn, uranus, neptune)
   * @param date - Optional date (ISO format). Defaults to current date.
   * @returns Position vector for the planet
   */
  async getPlanetPosition(planet: string, date?: string): Promise<APIResponse<any>> {
    const planetIds: Record<string, string> = {
      mercury: '199',
      venus: '299',
      mars: '499',
      jupiter: '599',
      saturn: '699',
      uranus: '799',
      neptune: '899',
      pluto: '999',
      moon: '301',
      sun: '10',
    };

    const bodyId = planetIds[planet.toLowerCase()];
    if (!bodyId) {
      return {
        success: false,
        error: {
          code: 'INVALID_PLANET',
          message: `Unknown planet: ${planet}. Valid options: ${Object.keys(planetIds).join(', ')}`,
        },
        metadata: {
          source: 'JPL-HORIZONS',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    const currentDate = date || new Date().toISOString().split('T')[0];
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return this.getEphemeris(bodyId, currentDate, nextDate.toISOString().split('T')[0], '1d');
  }

  /**
   * Get asteroid/comet data from Small-Body Database (SBDB)
   * @param designation - Asteroid designation or name (e.g., "433" for Eros, "1P" for Halley's Comet)
   * @returns Physical and orbital parameters
   */
  async getAsteroidData(designation: string): Promise<APIResponse<any>> {
    const params = {
      sstr: designation,
    };

    return this.sbdbClient.cachedGet(
      '/sbdb.api',
      { params },
      `asteroid:${designation}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get fireball (bright meteor) events
   * Data from NASA's Center for Near-Earth Object Studies (CNEOS)
   * @param dateMin - Optional minimum date (YYYY-MM-DD)
   * @param dateMax - Optional maximum date (YYYY-MM-DD)
   * @param reqLoc - Request location data (true/false, default true)
   * @param reqVel - Request velocity data (true/false, default true)
   * @param velComp - Request velocity components (true/false, default false)
   * @returns Array of fireball events
   */
  async getFireballs(
    dateMin?: string,
    dateMax?: string,
    reqLoc: boolean = true,
    reqVel: boolean = true,
    velComp: boolean = false
  ): Promise<APIResponse<{
    signature: {
      version: string;
      source: string;
    };
    count: string;
    fields: string[];
    data: any[][];
  }>> {
    const params: Record<string, string> = {
      'req-loc': reqLoc.toString(),
      'req-vel': reqVel.toString(),
      'vel-comp': velComp.toString(),
    };

    if (dateMin) {
      params['date-min'] = dateMin;
    }
    if (dateMax) {
      params['date-max'] = dateMax;
    }

    return this.fireballs.cachedGet(
      '/fireball.api',
      { params },
      `fireballs:${dateMin || 'all'}:${dateMax || 'all'}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get close approach data for Near-Earth Asteroids
   * @param dateMin - Minimum approach date (YYYY-MM-DD or 'now')
   * @param dateMax - Maximum approach date (YYYY-MM-DD or '+60' for 60 days from now)
   * @param distMax - Maximum distance in AU (default 0.05 AU)
   * @returns Array of close approach events
   */
  async getCloseApproaches(
    dateMin: string = 'now',
    dateMax: string = '+60',
    distMax: string = '0.05'
  ): Promise<APIResponse<{
    signature: {
      version: string;
      source: string;
    };
    count: string;
    fields: string[];
    data: any[][];
  }>> {
    const params = {
      'date-min': dateMin,
      'date-max': dateMax,
      'dist-max': distMax,
      sort: 'date',
    };

    return this.sbdbClient.cachedGet(
      '/cad.api',
      { params },
      `close-approach:${dateMin}:${dateMax}:${distMax}`,
      config.cache.ttl.neo
    );
  }

  /**
   * Get mission data for space missions
   * @param body - Target body ID or name
   * @returns Information about missions to the specified body
   */
  async getMissionData(body: string): Promise<APIResponse<any>> {
    return this.sbdbClient.cachedGet(
      '/missions.api',
      { params: { target: body } },
      `mission:${body}`,
      config.cache.ttl.mars // Cache longer, mission data is relatively static
    );
  }

  /**
   * Get planetary satellite data (moons)
   * @param planet - Planet name (mars, jupiter, saturn, uranus, neptune)
   * @returns List of moons with orbital parameters
   */
  async getPlanetarySatellites(planet: string): Promise<APIResponse<any>> {
    const planetCodes: Record<string, string> = {
      mars: '499',
      jupiter: '599',
      saturn: '699',
      uranus: '799',
      neptune: '899',
    };

    const planetCode = planetCodes[planet.toLowerCase()];
    if (!planetCode) {
      return {
        success: false,
        error: {
          code: 'INVALID_PLANET',
          message: `Unknown planet: ${planet}. Valid options: ${Object.keys(planetCodes).join(', ')}`,
        },
        metadata: {
          source: 'JPL-HORIZONS',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return this.sbdbClient.cachedGet(
      '/sats.api',
      { params: { planet: planetCode } },
      `satellites:${planet}`,
      config.cache.ttl.mars
    );
  }
}
