import { APIClient } from '../utils/api-client';
import { APIResponse, SolarWind, GeomagneticActivity, AuroraForecast, SolarFlare, CoronalMassEjection } from '@cosmic-atlas/shared';
import { config } from '../config';
import { NASAClient } from './nasa';

/**
 * Space Weather Client
 * Combines NOAA SWPC (Space Weather Prediction Center) and NASA DONKI
 * Real-time solar activity, geomagnetic storms, and aurora forecasts
 */
export class SpaceWeatherClient extends APIClient {
  private nasaClient: NASAClient;

  constructor() {
    super('NOAA-SWPC', 'https://services.swpc.noaa.gov', config.cache.ttl.spaceWeather);
    this.nasaClient = new NASAClient();
  }

  /**
   * Get aurora forecast based on geomagnetic activity
   * @returns Current aurora activity estimate (hemispheric power in GW)
   */
  async getAuroraForecast(): Promise<APIResponse<{hemisphericPower: number}>> {
    // Get Kp index to estimate aurora activity
    const geomagData = await this.getGeomagneticActivity();

    if (!geomagData.success) {
      return {
        success: false,
        error: {
          code: 'AURORA_FORECAST_ERROR',
          message: 'Failed to fetch aurora forecast',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    // Estimate hemispheric power from Kp index
    // Kp 0-1 ≈ 5-10 GW, Kp 2-3 ≈ 15-20 GW, Kp 4-5 ≈ 30-50 GW, Kp 6+ ≈ 80-150 GW
    const kp = geomagData.data?.kp || 0;
    const hemisphericPower = Math.round(5 + (kp * kp * 3)); // Quadratic relationship

    return {
      success: true,
      data: {
        hemisphericPower,
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: geomagData.metadata?.cached || false,
      },
    };
  }

  /**
   * Get real-time solar wind data
   * @returns Current solar wind speed, density, and temperature
   */
  async getSolarWind(): Promise<APIResponse<{speed: number, density: number, temperature: number}>> {
    const rawData = await this.cachedGet(
      '/products/solar-wind/plasma-1-day.json',
      {},
      'solar-wind',
      config.cache.ttl.spaceWeather
    );

    if (!rawData.success || !Array.isArray(rawData.data) || rawData.data.length < 2) {
      return {
        success: false,
        error: {
          code: 'SOLAR_WIND_ERROR',
          message: 'Failed to parse solar wind data',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    // NOAA plasma data: [0]=headers, last row is latest data
    // Columns: [0]=time_tag, [1]=density, [2]=speed, [3]=temperature
    const latest = rawData.data[rawData.data.length - 1];

    return {
      success: true,
      data: {
        speed: parseFloat(latest[2]) || 0,
        density: parseFloat(latest[1]) || 0,
        temperature: parseFloat(latest[3]) || 0,
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: rawData.metadata?.cached || false,
      },
    };
  }

  /**
   * Get geomagnetic activity (Kp index)
   * Kp index: 0-9 scale of geomagnetic disturbance
   * 0-4: quiet, 5: minor storm, 6: moderate storm, 7: strong storm, 8-9: severe storm
   * @returns Current Kp index value
   */
  async getGeomagneticActivity(): Promise<APIResponse<{kp: number}>> {
    const rawData = await this.cachedGet(
      '/products/noaa-planetary-k-index.json',
      {},
      'kp-index',
      config.cache.ttl.spaceWeather
    );

    if (!rawData.success || !Array.isArray(rawData.data) || rawData.data.length < 2) {
      return {
        success: false,
        error: {
          code: 'GEOMAGNETIC_ERROR',
          message: 'Failed to parse geomagnetic data',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    // NOAA Kp data: [0]=headers, last row is latest data
    // Columns: [0]=time_tag, [1]=Kp, [2]=a_running, [3]=station_count
    const latest = rawData.data[rawData.data.length - 1];

    return {
      success: true,
      data: {
        kp: parseFloat(latest[1]) || 0,
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: rawData.metadata?.cached || false,
      },
    };
  }

  /**
   * Get 3-day space weather forecast
   * @returns Forecast for next 3 days including solar activity and geomagnetic storms
   */
  async get3DayForecast(): Promise<APIResponse<any>> {
    return this.cachedGet(
      '/products/3-day-forecast.json',
      {},
      'forecast-3day',
      config.cache.ttl.spaceWeather
    );
  }

  /**
   * Get solar flare events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of solar flare events
   */
  async getSolarFlares(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('FLR', startDate, endDate);
  }

  /**
   * Get Coronal Mass Ejection (CME) events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of CME events with Earth impact predictions
   */
  async getCMEs(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('CME', startDate, endDate);
  }

  /**
   * Get geomagnetic storm events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of geomagnetic storm events
   */
  async getGeomagneticStorms(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('GST', startDate, endDate);
  }

  /**
   * Get solar energetic particle (SEP) events from NASA DONKI
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of SEP events
   */
  async getSEPEvents(startDate: string, endDate: string): Promise<APIResponse<any[]>> {
    return this.nasaClient.getDONKIEvents('SEP', startDate, endDate);
  }

  /**
   * Get comprehensive space weather summary
   * Combines multiple data sources for complete picture
   * @returns Comprehensive space weather data
   */
  async getSpaceWeatherSummary(): Promise<APIResponse<{
    solarWind: any;
    geomagneticActivity: any;
    auroraForecast: any;
    forecast3Day: any;
    timestamp: number;
  }>> {
    const [solarWind, geomagActivity, aurora, forecast] = await Promise.all([
      this.getSolarWind(),
      this.getGeomagneticActivity(),
      this.getAuroraForecast(),
      this.get3DayForecast(),
    ]);

    if (!solarWind.success || !geomagActivity.success || !aurora.success || !forecast.success) {
      return {
        success: false,
        error: {
          code: 'SPACE_WEATHER_ERROR',
          message: 'Failed to fetch complete space weather data',
        },
        metadata: {
          source: 'NOAA-SWPC',
          timestamp: Date.now(),
          cached: false,
        },
      };
    }

    return {
      success: true,
      data: {
        solarWind: solarWind.data,
        geomagneticActivity: geomagActivity.data,
        auroraForecast: aurora.data,
        forecast3Day: forecast.data,
        timestamp: Date.now(),
      },
      metadata: {
        source: 'NOAA-SWPC',
        timestamp: Date.now(),
        cached: false,
      },
    };
  }
}
