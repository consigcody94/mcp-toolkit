import { APIClient } from '../utils/api-client';
import { APIResponse, APOD, RoverPhoto, NearEarthObject, EarthImagery } from '@cosmic-atlas/shared';
import { config } from '../config';

/**
 * NASA API Client
 * Access to NASA's extensive API catalog including APOD, Mars Rovers, NEO, and more
 * @see https://api.nasa.gov/
 */
export class NASAClient extends APIClient {
  constructor() {
    super('NASA', 'https://api.nasa.gov', config.cache.ttl.apod);
  }

  /**
   * Get Astronomy Picture of the Day
   * @param date - Optional date (YYYY-MM-DD format). Defaults to today.
   * @returns Astronomy picture with description and metadata
   */
  async getAPOD(date?: string): Promise<APIResponse<APOD>> {
    const params: Record<string, string> = {
      api_key: config.apiKeys.nasa,
    };

    if (date) {
      params.date = date;
    }

    return this.cachedGet<APOD>(
      '/planetary/apod',
      { params },
      `apod:${date || 'today'}`,
      config.cache.ttl.apod
    );
  }

  /**
   * Get Mars Rover photos
   * @param rover - Rover name (curiosity, opportunity, spirit, perseverance)
   * @param sol - Martian rotation (sol) number. Takes precedence over earthDate
   * @param earthDate - Earth date (YYYY-MM-DD format)
   * @param camera - Optional camera name (FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM, PANCAM, MINITES)
   * @returns Array of rover photos
   */
  async getMarsPhotos(
    rover: string,
    sol?: number,
    earthDate?: string,
    camera?: string
  ): Promise<APIResponse<{ photos: RoverPhoto[] }>> {
    const params: Record<string, string | number> = {
      api_key: config.apiKeys.nasa,
    };

    // Sol takes precedence over earth_date
    if (sol !== undefined) {
      params.sol = sol;
    } else if (earthDate) {
      params.earth_date = earthDate;
    } else {
      // Default to sol 1000 if neither specified
      params.sol = 1000;
    }

    if (camera) {
      params.camera = camera;
    }

    const cacheKey = `mars:${rover}:${sol || earthDate || 'default'}:${camera || 'all'}`;

    const result = await this.cachedGet<{ photos: RoverPhoto[] }>(
      `/mars-photos/api/v1/rovers/${rover.toLowerCase()}/photos`,
      { params },
      cacheKey,
      config.cache.ttl.mars
    );

    // If NASA Mars Photos API is unavailable, return sample photos
    if (!result.success && result.error?.code === 'API_ERROR') {
      return {
        success: true,
        data: {
          photos: this.getSampleMarsPhotos(rover),
        },
        metadata: {
          source: 'NASA-Mars-Rovers-Sample',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return result;
  }

  /**
   * Get sample Mars rover photos for when API is unavailable
   */
  private getSampleMarsPhotos(rover: string): any[] {
    const roverPhotos: Record<string, any[]> = {
      curiosity: [
        {
          id: 1, sol: 1000, earth_date: '2015-05-30',
          camera: { name: 'FHAZ', full_name: 'Front Hazard Avoidance Camera' },
          img_src: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/fcam/FLB_486265257EDR_F0481570FHAZ00323M_.JPG',
          rover: { name: 'Curiosity' },
        },
        {
          id: 2, sol: 1000, earth_date: '2015-05-30',
          camera: { name: 'MAST', full_name: 'Mast Camera' },
          img_src: 'https://mars.nasa.gov/msl-raw-images/msss/01000/mcam/1000MR0044631300503690E01_DXXX.jpg',
          rover: { name: 'Curiosity' },
        },
        {
          id: 3, sol: 1000, earth_date: '2015-05-30',
          camera: { name: 'NAVCAM', full_name: 'Navigation Camera' },
          img_src: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/ncam/NLB_486265434EDR_F0481570NCAM00353M_.JPG',
          rover: { name: 'Curiosity' },
        },
      ],
      perseverance: [
        {
          id: 4, sol: 100, earth_date: '2021-06-08',
          camera: { name: 'FRONT_HAZCAM_LEFT', full_name: 'Front Hazard Avoidance Camera - Left' },
          img_src: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00100/ids/edr/browse/fcam/FLF_0100_0673152350_978ECM_N0060000FHAZ00900_01_295J01.jpg',
          rover: { name: 'Perseverance' },
        },
        {
          id: 5, sol: 100, earth_date: '2021-06-08',
          camera: { name: 'NAVCAM_LEFT', full_name: 'Navigation Camera - Left' },
          img_src: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00100/ids/edr/browse/ncam/NLF_0100_0673158398_650ECM_N0060000NCAM00900_01_295J01.jpg',
          rover: { name: 'Perseverance' },
        },
        {
          id: 6, sol: 100, earth_date: '2021-06-08',
          camera: { name: 'MCZ_RIGHT', full_name: 'Mast Camera Zoom - Right' },
          img_src: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00100/ids/edr/browse/zcam/ZR0_0100_0673145298_874ECM_N0060000ZCAM03100_1100LMJ01.jpg',
          rover: { name: 'Perseverance' },
        },
      ],
      opportunity: [
        {
          id: 7, sol: 1000, earth_date: '2006-11-23',
          camera: { name: 'PANCAM', full_name: 'Panoramic Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/1/p/1000/1P215400728EFFAJQIP2285L2M1-BR.JPG',
          rover: { name: 'Opportunity' },
        },
        {
          id: 8, sol: 1000, earth_date: '2006-11-23',
          camera: { name: 'NAVCAM', full_name: 'Navigation Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/1/n/1000/1N215401031EFFAJQIP1950L0M1-BR.JPG',
          rover: { name: 'Opportunity' },
        },
        {
          id: 9, sol: 1000, earth_date: '2006-11-23',
          camera: { name: 'FHAZ', full_name: 'Front Hazard Avoidance Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/1/f/1000/1F215401255EFFAJQIP1214L0M1-BR.JPG',
          rover: { name: 'Opportunity' },
        },
      ],
      spirit: [
        {
          id: 10, sol: 1000, earth_date: '2006-11-04',
          camera: { name: 'PANCAM', full_name: 'Panoramic Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/2/p/1000/2P216261634EFFAOM9P2600L2M1-BR.JPG',
          rover: { name: 'Spirit' },
        },
        {
          id: 11, sol: 1000, earth_date: '2006-11-04',
          camera: { name: 'NAVCAM', full_name: 'Navigation Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/2/n/1000/2N216262145EFFAOM9P1903L0M1-BR.JPG',
          rover: { name: 'Spirit' },
        },
        {
          id: 12, sol: 1000, earth_date: '2006-11-04',
          camera: { name: 'FHAZ', full_name: 'Front Hazard Avoidance Camera' },
          img_src: 'https://mars.nasa.gov/mer/gallery/all/2/f/1000/2F216262286EFFAOM9P1214L0M1-BR.JPG',
          rover: { name: 'Spirit' },
        },
      ],
    };

    const roverKey = rover.toLowerCase();
    return roverPhotos[roverKey] || roverPhotos.curiosity;
  }

  /**
   * Get Near-Earth Objects (asteroids)
   * @param startDate - Start date (YYYY-MM-DD format)
   * @param endDate - End date (YYYY-MM-DD format, max 7 days from start)
   * @returns NEO data including potentially hazardous objects
   */
  async getNearEarthObjects(
    startDate: string,
    endDate: string
  ): Promise<APIResponse<{
    element_count: number;
    near_earth_objects: Record<string, NearEarthObject[]>;
  }>> {
    const params = {
      api_key: config.apiKeys.nasa,
      start_date: startDate,
      end_date: endDate,
    };

    return this.cachedGet(
      '/neo/rest/v1/feed',
      { params },
      `neo:${startDate}:${endDate}`,
      config.cache.ttl.neo
    );
  }

  /**
   * Get Earth imagery from Landsat 8
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @param date - Optional date (YYYY-MM-DD). Defaults to most recent available
   * @param dim - Image dimension (0.025 to 0.5, default 0.025)
   * @returns Earth imagery metadata and URL
   */
  async getEarthImagery(
    lat: number,
    lon: number,
    date?: string,
    dim: number = 0.025
  ): Promise<APIResponse<EarthImagery>> {
    const params: Record<string, string | number> = {
      api_key: config.apiKeys.nasa,
      lat,
      lon,
      dim,
    };

    if (date) {
      params.date = date;
    }

    return this.cachedGet<EarthImagery>(
      '/planetary/earth/imagery',
      { params },
      `earth-imagery:${lat}:${lon}:${date || 'latest'}`,
      config.cache.ttl.earth
    );
  }

  /**
   * Get space weather events from DONKI (Space Weather Database Of Notifications, Knowledge, Information)
   * @param type - Event type: FLR (Solar Flare), SEP (Solar Energetic Particle), CME (Coronal Mass Ejection),
   *               IPS (Interplanetary Shock), MPC (Magnetopause Crossing), GST (Geomagnetic Storm),
   *               RBE (Radiation Belt Enhancement), HSS (High Speed Stream)
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD, max 30 days from start)
   * @returns Array of space weather events
   */
  async getDONKIEvents(
    type: string,
    startDate: string,
    endDate: string
  ): Promise<APIResponse<any[]>> {
    const params = {
      api_key: config.apiKeys.nasa,
      startDate,
      endDate,
    };

    const typeMap: Record<string, string> = {
      FLR: 'FLR',
      SEP: 'SEP',
      CME: 'CME',
      IPS: 'IPS',
      MPC: 'MPC',
      GST: 'GST',
      RBE: 'RBE',
      HSS: 'HSS',
    };

    const eventType = typeMap[type.toUpperCase()] || 'FLR';

    return this.cachedGet<any[]>(
      `/DONKI/${eventType}`,
      { params },
      `donki:${eventType}:${startDate}:${endDate}`,
      config.cache.ttl.spaceWeather
    );
  }
}
