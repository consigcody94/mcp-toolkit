import { Router } from 'express';
import { NASAClient } from '../services/nasa';
import { SatelliteClient } from '../services/satellite';
import { ISSClient } from '../services/iss';
import { SpaceXClient } from '../services/spacex';
import { LaunchClient } from '../services/launches';
import { SpaceWeatherClient } from '../services/spaceWeather';
import { ExoplanetClient } from '../services/exoplanets';
import { SolarSystemClient } from '../services/solarSystem';
import { EarthClient } from '../services/earth';
import { cache } from '../utils/cache';

const router = Router();

// Initialize all API clients
const nasa = new NASAClient();
const satellite = new SatelliteClient();
const iss = new ISSClient();
const spacex = new SpaceXClient();
const launches = new LaunchClient();
const spaceWeather = new SpaceWeatherClient();
const exoplanets = new ExoplanetClient();
const solarSystem = new SolarSystemClient();
const earth = new EarthClient();

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/health', (req, res) => {
  const stats = cache.getStats();
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    },
  });
});

// ============================================================================
// NASA ROUTES
// ============================================================================

router.get('/nasa/apod', async (req, res) => {
  const { date } = req.query;
  const result = await nasa.getAPOD(date as string);
  res.json(result);
});

router.get('/nasa/mars/:rover', async (req, res) => {
  const { rover } = req.params;
  const { sol, earth_date, camera } = req.query;
  const result = await nasa.getMarsPhotos(
    rover,
    sol ? parseInt(sol as string, 10) : undefined,
    earth_date as string,
    camera as string
  );
  res.json(result);
});

router.get('/nasa/neo', async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'start_date and end_date are required',
      },
    });
  }
  const result = await nasa.getNearEarthObjects(start_date as string, end_date as string);
  res.json(result);
});

router.get('/nasa/earth/imagery', async (req, res) => {
  const { lat, lon, date, dim, cloud_score } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await nasa.getEarthImagery(
    parseFloat(lat as string),
    parseFloat(lon as string),
    date as string,
    dim ? parseFloat(dim as string) : undefined
  );
  res.json(result);
});

router.get('/nasa/donki/:eventType', async (req, res) => {
  const { eventType } = req.params;
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'start_date and end_date are required',
      },
    });
  }
  const result = await nasa.getDONKIEvents(
    eventType,
    start_date as string,
    end_date as string
  );
  res.json(result);
});

// ============================================================================
// SATELLITE ROUTES
// ============================================================================

router.get('/satellites/:noradId/position', async (req, res) => {
  const { noradId } = req.params;
  const { lat, lon, alt, seconds } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await satellite.getPosition(
    parseInt(noradId, 10),
    parseFloat(lat as string),
    parseFloat(lon as string),
    alt ? parseFloat(alt as string) : 0,
    seconds ? parseInt(seconds as string, 10) : 300
  );
  res.json(result);
});

router.get('/satellites/:noradId/passes', async (req, res) => {
  const { noradId } = req.params;
  const { lat, lon, alt, days, min_visibility } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await satellite.getVisualPasses(
    parseInt(noradId, 10),
    parseFloat(lat as string),
    parseFloat(lon as string),
    alt ? parseFloat(alt as string) : 0,
    days ? parseInt(days as string, 10) : 10,
    min_visibility ? parseInt(min_visibility as string, 10) : 300
  );
  res.json(result);
});

router.get('/satellites/:noradId/tle', async (req, res) => {
  const { noradId } = req.params;
  const result = await satellite.getTLE(parseInt(noradId, 10));
  res.json(result);
});

router.get('/satellites/above', async (req, res) => {
  const { lat, lon, alt, radius, category } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await satellite.getSatellitesAbove(
    parseFloat(lat as string),
    parseFloat(lon as string),
    alt ? parseFloat(alt as string) : 0,
    radius ? parseFloat(radius as string) : 90,
    category ? parseInt(category as string, 10) : undefined
  );
  res.json(result);
});

// ============================================================================
// ISS ROUTES
// ============================================================================

router.get('/iss/position', async (req, res) => {
  const result = await iss.getCurrentPosition();
  res.json(result);
});

router.get('/iss/passes', async (req, res) => {
  const { lat, lon, alt, n } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await iss.getPassTimes(
    parseFloat(lat as string),
    parseFloat(lon as string),
    alt ? parseFloat(alt as string) : 0,
    n ? parseInt(n as string, 10) : 5
  );
  res.json(result);
});

router.get('/iss/astronauts', async (req, res) => {
  const result = await iss.getAstronauts();
  res.json(result);
});

// ============================================================================
// SPACEX ROUTES
// ============================================================================

router.get('/spacex/launches/latest', async (req, res) => {
  const result = await spacex.getLatestLaunch();
  res.json(result);
});

router.get('/spacex/launches/next', async (req, res) => {
  const result = await spacex.getNextLaunch();
  res.json(result);
});

router.get('/spacex/launches/upcoming', async (req, res) => {
  const { limit } = req.query;
  const result = await spacex.getUpcomingLaunches(
    limit ? parseInt(limit as string, 10) : 10
  );
  res.json(result);
});

router.get('/spacex/rockets', async (req, res) => {
  const result = await spacex.getRockets();
  res.json(result);
});

router.get('/spacex/starlink', async (req, res) => {
  const { limit } = req.query;
  const result = await spacex.getStarlink(limit ? parseInt(limit as string, 10) : 100);
  res.json(result);
});

router.get('/spacex/capsules', async (req, res) => {
  const result = await spacex.getCapsules();
  res.json(result);
});

// ============================================================================
// LAUNCHES ROUTES (All Providers)
// ============================================================================

router.get('/launches/upcoming', async (req, res) => {
  const { limit, offset } = req.query;
  const result = await launches.getUpcomingLaunches(
    limit ? parseInt(limit as string, 10) : 10,
    offset ? parseInt(offset as string, 10) : 0
  );
  res.json(result);
});

router.get('/launches/past', async (req, res) => {
  const { limit, offset } = req.query;
  const result = await launches.getPastLaunches(
    limit ? parseInt(limit as string, 10) : 10,
    offset ? parseInt(offset as string, 10) : 0
  );
  res.json(result);
});

router.get('/launches/:id', async (req, res) => {
  const { id } = req.params;
  const result = await launches.getLaunchById(id);
  res.json(result);
});

router.get('/launches/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'q (query) parameter is required',
      },
    });
  }
  const result = await launches.searchLaunches(
    q as string,
    limit ? parseInt(limit as string, 10) : 10
  );
  res.json(result);
});

// ============================================================================
// SPACE WEATHER ROUTES
// ============================================================================

router.get('/space-weather/aurora', async (req, res) => {
  const result = await spaceWeather.getAuroraForecast();
  res.json(result);
});

router.get('/space-weather/solar-wind', async (req, res) => {
  const result = await spaceWeather.getSolarWind();
  res.json(result);
});

router.get('/space-weather/geomagnetic', async (req, res) => {
  const result = await spaceWeather.getGeomagneticActivity();
  res.json(result);
});

router.get('/space-weather/forecast', async (req, res) => {
  const result = await spaceWeather.get3DayForecast();
  res.json(result);
});

router.get('/space-weather/solar-flares', async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'start_date and end_date are required',
      },
    });
  }
  const result = await spaceWeather.getSolarFlares(start_date as string, end_date as string);
  res.json(result);
});

router.get('/space-weather/cmes', async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'start_date and end_date are required',
      },
    });
  }
  const result = await spaceWeather.getCMEs(start_date as string, end_date as string);
  res.json(result);
});

router.get('/space-weather/summary', async (req, res) => {
  const result = await spaceWeather.getSpaceWeatherSummary();
  res.json(result);
});

// ============================================================================
// ROUTE ALIASES (for frontend compatibility)
// ============================================================================

// APOD alias
router.get('/apod', async (req, res) => {
  const { date } = req.query;
  const result = await nasa.getAPOD(date as string);
  res.json(result);
});

// Mars rovers alias
router.get('/mars/:rover', async (req, res) => {
  const { rover } = req.params;
  const { sol, earth_date, camera } = req.query;
  const result = await nasa.getMarsPhotos(
    rover,
    sol ? parseInt(sol as string, 10) : undefined,
    earth_date as string,
    camera as string
  );
  res.json(result);
});

// ============================================================================
// EXOPLANETS ROUTES
// ============================================================================

router.post('/exoplanets/search', async (req, res) => {
  const result = await exoplanets.searchExoplanets(req.body);
  res.json(result);
});

router.get('/exoplanets/:name', async (req, res) => {
  const { name } = req.params;
  const result = await exoplanets.getExoplanetByName(name);
  res.json(result);
});

router.get('/exoplanets/stats/summary', async (req, res) => {
  const result = await exoplanets.getExoplanetStats();
  res.json(result);
});

// ============================================================================
// SOLAR SYSTEM ROUTES
// ============================================================================

router.get('/solar-system/:body/ephemeris', async (req, res) => {
  const { body } = req.params;
  const { start, stop, step } = req.query;
  if (!start || !stop) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'start and stop time parameters are required',
      },
    });
  }
  const result = await solarSystem.getEphemeris(
    body,
    start as string,
    stop as string,
    (step as string) || '1h'
  );
  res.json(result);
});

router.get('/solar-system/planets/:planet', async (req, res) => {
  const { planet } = req.params;
  const { date } = req.query;
  const result = await solarSystem.getPlanetPosition(planet, date as string);
  res.json(result);
});

router.get('/solar-system/asteroids/:designation', async (req, res) => {
  const { designation } = req.params;
  const result = await solarSystem.getAsteroidData(designation);
  res.json(result);
});

router.get('/solar-system/fireballs', async (req, res) => {
  const { date_min, date_max } = req.query;
  const result = await solarSystem.getFireballs(date_min as string, date_max as string);
  res.json(result);
});

// ============================================================================
// EARTH ROUTES
// ============================================================================

router.get('/earth/events', async (req, res) => {
  const { category, status, days } = req.query;
  const result = await earth.getNaturalEvents(
    category as string,
    status as string,
    days ? parseInt(days as string, 10) : undefined
  );
  res.json(result);
});

router.get('/earth/events/:id', async (req, res) => {
  const { id } = req.params;
  const result = await earth.getEventById(id);
  res.json(result);
});

router.get('/earth/imagery', async (req, res) => {
  const { lat, lon, date, dim } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'lat and lon are required',
      },
    });
  }
  const result = await earth.getEarthImagery(
    parseFloat(lat as string),
    parseFloat(lon as string),
    date as string,
    dim ? parseFloat(dim as string) : undefined
  );
  res.json(result);
});

export default router;
