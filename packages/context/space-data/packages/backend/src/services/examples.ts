/**
 * Cosmic Atlas API Client Usage Examples
 * Comprehensive examples for all API clients
 */

import {
  NASAClient,
  SatelliteClient,
  ISSClient,
  SpaceXClient,
  LaunchClient,
  SpaceWeatherClient,
  ExoplanetClient,
  SolarSystemClient,
  EarthClient,
} from './index';

/**
 * Example 1: Build a comprehensive space dashboard
 */
export async function buildSpaceDashboard() {
  const nasa = new NASAClient();
  const iss = new ISSClient();
  const spacex = new SpaceXClient();
  const weather = new SpaceWeatherClient();
  const launches = new LaunchClient();

  try {
    // Fetch all data in parallel
    const [apod, issPosition, nextLaunch, spaceWeather, upcomingLaunches] = await Promise.all([
      nasa.getAPOD(),
      iss.getEnhancedPosition(),
      spacex.getNextLaunch(),
      weather.getSpaceWeatherSummary(),
      launches.getUpcomingLaunches(5),
    ]);

    return {
      success: true,
      data: {
        pictureOfTheDay: apod.data,
        issLocation: issPosition.data,
        nextSpaceXLaunch: nextLaunch.data,
        spaceWeather: spaceWeather.data,
        upcomingLaunches: upcomingLaunches.data?.results,
      },
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example 2: Location-based space tracking
 */
export async function getLocationSpaceData(lat: number, lon: number, alt: number = 0) {
  const iss = new ISSClient();
  const satellite = new SatelliteClient();
  const earth = new EarthClient();

  try {
    const [issPasses, satellitesAbove, naturalEvents, earthImagery] = await Promise.all([
      iss.getPassTimes(lat, lon, alt, 10),
      satellite.getSatellitesAbove(lat, lon, alt, 70, 0),
      earth.getNaturalEvents(undefined, 'open', 30),
      earth.getEarthImagery(lat, lon),
    ]);

    return {
      location: { lat, lon, alt },
      issPasses: issPasses.data,
      visibleSatellites: satellitesAbove.data,
      nearbyEvents: naturalEvents.data,
      satelliteImagery: earthImagery.data,
    };
  } catch (error) {
    console.error('Location data error:', error);
    throw error;
  }
}

/**
 * Example 3: Track specific satellite (ISS)
 */
export async function trackISS(observerLat: number, observerLon: number) {
  const iss = new ISSClient();
  const satellite = new SatelliteClient();

  try {
    // Get current position
    const position = await iss.getEnhancedPosition();

    // Get upcoming passes
    const passes = await iss.getPassTimes(observerLat, observerLon, 0, 5);

    // Get detailed tracking with N2YO
    const detailedTracking = await satellite.getPosition(25544, observerLat, observerLon, 0, 300);

    // Get visual passes
    const visualPasses = await satellite.getVisualPasses(25544, observerLat, observerLon, 0, 10);

    return {
      currentPosition: position.data,
      upcomingPasses: passes.data,
      detailedTracking: detailedTracking.data,
      visualPasses: visualPasses.data,
    };
  } catch (error) {
    console.error('ISS tracking error:', error);
    throw error;
  }
}

/**
 * Example 4: Mars exploration data
 */
export async function getMarsExplorationData() {
  const nasa = new NASAClient();

  try {
    // Get photos from multiple rovers
    const [curiosityPhotos, perseverancePhotos] = await Promise.all([
      nasa.getMarsPhotos('curiosity', undefined, new Date().toISOString().split('T')[0]),
      nasa.getMarsPhotos('perseverance', undefined, new Date().toISOString().split('T')[0]),
    ]);

    // Get specific camera photos
    const navcamPhotos = await nasa.getMarsPhotos('curiosity', 1000, undefined, 'NAVCAM');

    return {
      curiosity: curiosityPhotos.data,
      perseverance: perseverancePhotos.data,
      navigationCamera: navcamPhotos.data,
    };
  } catch (error) {
    console.error('Mars data error:', error);
    throw error;
  }
}

/**
 * Example 5: Space weather monitoring
 */
export async function monitorSpaceWeather() {
  const weather = new SpaceWeatherClient();

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [summary, solarFlares, cmes, storms] = await Promise.all([
      weather.getSpaceWeatherSummary(),
      weather.getSolarFlares(startDate, endDate),
      weather.getCMEs(startDate, endDate),
      weather.getGeomagneticStorms(startDate, endDate),
    ]);

    return {
      current: summary.data,
      recentFlares: solarFlares.data,
      recentCMEs: cmes.data,
      geomagneticStorms: storms.data,
    };
  } catch (error) {
    console.error('Space weather error:', error);
    throw error;
  }
}

/**
 * Example 6: Asteroid and NEO tracking
 */
export async function trackNearEarthObjects() {
  const nasa = new NASAClient();
  const solarSystem = new SolarSystemClient();

  try {
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date().toISOString().split('T')[0];

    const [neos, closeApproaches, fireballs, asteroidData] = await Promise.all([
      nasa.getNearEarthObjects(startDate, endDate),
      solarSystem.getCloseApproaches('now', '+60', '0.05'),
      solarSystem.getFireballs(startDate, endDate),
      solarSystem.getAsteroidData('433'), // Eros
    ]);

    return {
      nearEarthObjects: neos.data,
      upcomingApproaches: closeApproaches.data,
      recentFireballs: fireballs.data,
      asteroidExample: asteroidData.data,
    };
  } catch (error) {
    console.error('NEO tracking error:', error);
    throw error;
  }
}

/**
 * Example 7: Exoplanet discovery search
 */
export async function searchExoplanets() {
  const exoplanets = new ExoplanetClient();

  try {
    const [habitable, recent, trappist, stats] = await Promise.all([
      exoplanets.getHabitableExoplanets(50),
      exoplanets.searchExoplanets({ discoveryYear: 2023, limit: 100 }),
      exoplanets.getExoplanetsByHost('TRAPPIST-1'),
      exoplanets.getExoplanetStats(),
    ]);

    return {
      potentiallyHabitable: habitable.data,
      recentDiscoveries: recent.data,
      trappistSystem: trappist.data,
      statistics: stats.data,
    };
  } catch (error) {
    console.error('Exoplanet search error:', error);
    throw error;
  }
}

/**
 * Example 8: SpaceX launch tracking
 */
export async function trackSpaceXLaunches() {
  const spacex = new SpaceXClient();
  const launches = new LaunchClient();

  try {
    const [latest, next, upcoming, rockets, starlink] = await Promise.all([
      spacex.getLatestLaunch(),
      spacex.getNextLaunch(),
      spacex.getUpcomingLaunches(10),
      spacex.getRockets(),
      spacex.getStarlink(50),
    ]);

    // Also get launches from other providers
    const allUpcoming = await launches.getUpcomingLaunches(20);

    return {
      spacex: {
        latestLaunch: latest.data,
        nextLaunch: next.data,
        upcomingLaunches: upcoming.data,
        rockets: rockets.data,
        starlinkSatellites: starlink.data,
      },
      allProviders: allUpcoming.data?.results,
    };
  } catch (error) {
    console.error('Launch tracking error:', error);
    throw error;
  }
}

/**
 * Example 9: Solar system exploration
 */
export async function exploreSolarSystem() {
  const solarSystem = new SolarSystemClient();

  try {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [mars, jupiter, asteroidData, jupiterMoons] = await Promise.all([
      solarSystem.getPlanetPosition('mars', today),
      solarSystem.getPlanetPosition('jupiter', today),
      solarSystem.getAsteroidData('1'), // Ceres
      solarSystem.getPlanetarySatellites('jupiter'),
    ]);

    return {
      planetPositions: {
        mars: mars.data,
        jupiter: jupiter.data,
      },
      dwarfPlanet: asteroidData.data,
      jupiterMoons: jupiterMoons.data,
    };
  } catch (error) {
    console.error('Solar system error:', error);
    throw error;
  }
}

/**
 * Example 10: Earth observation and natural events
 */
export async function monitorEarth(lat: number, lon: number) {
  const earth = new EarthClient();

  try {
    const [wildfires, volcanoes, storms, imagery, assets] = await Promise.all([
      earth.getWildfires(7),
      earth.getVolcanicActivity(30),
      earth.getSevereStorms(7),
      earth.getEarthImagery(lat, lon),
      earth.getEarthAssets(lat, lon),
    ]);

    return {
      naturalEvents: {
        activeWildfires: wildfires.data,
        volcanicActivity: volcanoes.data,
        severeStorms: storms.data,
      },
      imagery: {
        current: imagery.data,
        available: assets.data,
      },
    };
  } catch (error) {
    console.error('Earth monitoring error:', error);
    throw error;
  }
}

/**
 * Example 11: Real-time space station tracking with updates
 */
export async function setupISSTracking(
  observerLat: number,
  observerLon: number,
  updateCallback: (data: any) => void
) {
  const iss = new ISSClient();

  // Update every 5 seconds
  const interval = setInterval(async () => {
    try {
      const position = await iss.getEnhancedPosition();

      if (position.success && position.data) {
        updateCallback({
          timestamp: position.data.timestamp,
          latitude: position.data.latitude,
          longitude: position.data.longitude,
          altitude: position.data.altitude,
          velocity: position.data.velocity,
          visibility: position.data.visibility,
          footprint: position.data.footprint,
        });
      }
    } catch (error) {
      console.error('ISS tracking update error:', error);
    }
  }, 5000);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Example 12: Comprehensive error handling
 */
export async function robustAPICall() {
  const nasa = new NASAClient();

  try {
    const result = await nasa.getAPOD('2024-01-01');

    // Check if request was successful
    if (!result.success) {
      console.error('API Error:', result.error?.code, result.error?.message);
      return null;
    }

    // Check if data exists
    if (!result.data) {
      console.error('No data returned');
      return null;
    }

    // Check cache status
    if (result.metadata?.cached) {
      console.log('Data served from cache');
    }

    // Check rate limits
    if (result.metadata?.rateLimit) {
      const { remaining, limit, reset } = result.metadata.rateLimit;
      console.log(`Rate limit: ${remaining}/${limit}, resets at ${new Date(reset * 1000)}`);
    }

    return result.data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

/**
 * Example 13: Batch processing with rate limit awareness
 */
export async function batchProcessLaunches() {
  const launches = new LaunchClient();
  const results: any[] = [];

  try {
    // Fetch in batches to respect rate limits
    for (let offset = 0; offset < 100; offset += 10) {
      const response = await launches.getUpcomingLaunches(10, offset);

      if (response.success && response.data?.results) {
        results.push(...response.data.results);
      }

      // Add delay between requests to avoid rate limiting
      if (offset < 90) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }
    }

    return results;
  } catch (error) {
    console.error('Batch processing error:', error);
    return results; // Return what we have so far
  }
}

/**
 * Example 14: Multi-source data aggregation
 */
export async function aggregateSpaceData() {
  const nasa = new NASAClient();
  const spacex = new SpaceXClient();
  const weather = new SpaceWeatherClient();
  const exoplanets = new ExoplanetClient();

  try {
    const [apod, nextLaunch, spaceWeather, exoplanetStats] = await Promise.all([
      nasa.getAPOD(),
      spacex.getNextLaunch(),
      weather.get3DayForecast(),
      exoplanets.getExoplanetStats(),
    ]);

    return {
      daily: {
        pictureOfTheDay: apod.data,
        updated: new Date().toISOString(),
      },
      launches: {
        next: nextLaunch.data,
      },
      weather: {
        forecast: spaceWeather.data,
      },
      science: {
        exoplanetDatabase: exoplanetStats.data,
      },
    };
  } catch (error) {
    console.error('Data aggregation error:', error);
    throw error;
  }
}
