# Cosmic Atlas API Clients

Production-ready API clients for comprehensive space data access. Each client extends the base `APIClient` class with intelligent caching, error handling, and rate limit management.

## Architecture

```
services/
├── nasa.ts           - NASA APIs (APOD, Mars, NEO, Earth, DONKI)
├── satellite.ts      - Satellite tracking (N2YO, CelesTrak)
├── iss.ts           - ISS tracking and astronauts
├── spacex.ts        - SpaceX launches, rockets, Starlink
├── launches.ts      - Launch Library 2 (all providers)
├── spaceWeather.ts  - NOAA SWPC + NASA DONKI
├── exoplanets.ts    - NASA Exoplanet Archive
├── solarSystem.ts   - JPL HORIZONS, SBDB, Fireballs
├── earth.ts         - NASA EONET, Landsat imagery
└── index.ts         - Unified exports
```

## Quick Start

```typescript
import {
  NASAClient,
  ISSClient,
  SpaceXClient,
  SatelliteClient
} from './services';

// Initialize clients
const nasa = new NASAClient();
const iss = new ISSClient();
const spacex = new SpaceXClient();

// Get data
const apod = await nasa.getAPOD();
const issPosition = await iss.getCurrentPosition();
const nextLaunch = await spacex.getNextLaunch();
```

## API Clients

### 1. NASAClient

Access NASA's extensive API catalog.

```typescript
const nasa = new NASAClient();

// Astronomy Picture of the Day
const apod = await nasa.getAPOD('2024-01-01');

// Mars Rover Photos
const photos = await nasa.getMarsPhotos('curiosity', 1000, undefined, 'NAVCAM');

// Near-Earth Objects
const neos = await nasa.getNearEarthObjects('2024-01-01', '2024-01-07');

// Earth Imagery from Landsat
const imagery = await nasa.getEarthImagery(37.7749, -122.4194);

// Space Weather Events (DONKI)
const flares = await nasa.getDONKIEvents('FLR', '2024-01-01', '2024-01-31');
```

**Cache TTL:**
- APOD: 24 hours (updates daily)
- Mars: 1 hour (images static)
- NEO: 1 hour
- Earth: 1 hour
- DONKI: 5 minutes (space weather)

**API Keys:** Requires `NASA_API_KEY` (or uses DEMO_KEY)

---

### 2. SatelliteClient

Track satellites using N2YO (primary) and CelesTrak (fallback).

```typescript
const satellite = new SatelliteClient();

// Real-time position
const position = await satellite.getPosition(25544, 37.7749, -122.4194, 0, 10);

// Visual passes (when visible)
const passes = await satellite.getVisualPasses(25544, 37.7749, -122.4194, 0, 10);

// Two-Line Element (TLE) data
const tle = await satellite.getTLE(25544);

// Satellites above location
const above = await satellite.getSatellitesAbove(37.7749, -122.4194, 0, 70);

// CelesTrak fallback (no key required)
const celestrakTLE = await satellite.getCelesTrakTLE('25544');
```

**Cache TTL:**
- Position: 1 minute (fast-moving)
- Passes: 10 minutes
- TLE: 1 hour (changes slowly)

**API Keys:**
- Primary: `N2YO_API_KEY` (required for most features)
- Fallback: CelesTrak (no key needed)

**NORAD IDs:**
- ISS: 25544
- Hubble: 20580
- Tiangong: 48274

---

### 3. ISSClient

Real-time ISS tracking and crew information.

```typescript
const iss = new ISSClient();

// Current position (updates every ~5 seconds)
const position = await iss.getCurrentPosition();

// Pass times for location
const passes = await iss.getPassTimes(37.7749, -122.4194, 0, 5);

// People in space
const astronauts = await iss.getAstronauts();

// Enhanced position with calculated data
const enhanced = await iss.getEnhancedPosition();
```

**Cache TTL:**
- Position: 5 seconds (very fast-moving)
- Passes: 10 minutes
- Astronauts: 5 minutes

**API Keys:** None required (Open Notify API)

---

### 4. SpaceXClient

SpaceX launches, rockets, capsules, and Starlink.

```typescript
const spacex = new SpaceXClient();

// Latest and next launches
const latest = await spacex.getLatestLaunch();
const next = await spacex.getNextLaunch();

// Upcoming launches
const upcoming = await spacex.getUpcomingLaunches(10);

// Rockets
const rockets = await spacex.getRockets();

// Starlink satellites
const starlink = await spacex.getStarlink(50);

// Dragon capsules
const capsules = await spacex.getCapsules();

// Launchpads
const launchpads = await spacex.getLaunchpads();
```

**Cache TTL:** 5 minutes (schedules change frequently)

**API Keys:** None required (SpaceX API v5)

---

### 5. LaunchClient

Comprehensive launch schedule from all providers worldwide.

```typescript
const launches = new LaunchClient();

// Upcoming launches
const upcoming = await launches.getUpcomingLaunches(10, 0);

// Past launches
const past = await launches.getPastLaunches(10, 0);

// Specific launch
const launch = await launches.getLaunchById('launch-uuid');

// Search launches
const results = await launches.searchLaunches('falcon');

// Filter by provider
const spaceXLaunches = await launches.getLaunchesByProvider(121);

// Filter by rocket
const falcon9 = await launches.getLaunchesByRocket(1);

// Filter by location
const capeCanaveral = await launches.getLaunchesByLocation(27);
```

**Cache TTL:** 10 minutes (respects 15/hour rate limit)

**API Keys:** None required

**Rate Limits:** 15 requests/hour (free tier)

---

### 6. SpaceWeatherClient

Real-time space weather from NOAA SWPC and NASA DONKI.

```typescript
const weather = new SpaceWeatherClient();

// Aurora forecast
const aurora = await weather.getAuroraForecast();

// Solar wind
const solarWind = await weather.getSolarWind();

// Geomagnetic activity (Kp index)
const kp = await weather.getGeomagneticActivity();

// 3-day forecast
const forecast = await weather.get3DayForecast();

// Solar flares
const flares = await weather.getSolarFlares('2024-01-01', '2024-01-31');

// Coronal Mass Ejections
const cmes = await weather.getCMEs('2024-01-01', '2024-01-31');

// Geomagnetic storms
const storms = await weather.getGeomagneticStorms('2024-01-01', '2024-01-31');

// Solar Energetic Particles
const sep = await weather.getSEPEvents('2024-01-01', '2024-01-31');

// Comprehensive summary
const summary = await weather.getSpaceWeatherSummary();
```

**Cache TTL:** 5 minutes (real-time data)

**API Keys:** Requires `NASA_API_KEY` for DONKI events

**Kp Index Scale:**
- 0-4: Quiet
- 5: Minor storm
- 6: Moderate storm
- 7: Strong storm
- 8-9: Severe storm

---

### 7. ExoplanetClient

NASA Exoplanet Archive with TAP queries.

```typescript
const exoplanets = new ExoplanetClient();

// Search with filters
const results = await exoplanets.searchExoplanets({
  discoveryMethod: 'Transit',
  minRadius: 0.5,
  maxRadius: 2.0,
  discoveryYear: 2023,
  limit: 50
});

// Get specific exoplanet
const planet = await exoplanets.getExoplanetByName('Kepler-186 f');

// Database statistics
const stats = await exoplanets.getExoplanetStats();

// Potentially habitable
const habitable = await exoplanets.getHabitableExoplanets(50);

// By discovery method
const transit = await exoplanets.getExoplanetsByMethod('Transit', 100);

// By host star
const trappist = await exoplanets.getExoplanetsByHost('TRAPPIST-1');
```

**Cache TTL:** 24 hours (static data)

**API Keys:** None required

**Discovery Methods:**
- Transit
- Radial Velocity
- Imaging
- Microlensing
- Transit Timing Variations

---

### 8. SolarSystemClient

JPL HORIZONS ephemeris and small body database.

```typescript
const solarSystem = new SolarSystemClient();

// Ephemeris (position/velocity)
const ephemeris = await solarSystem.getEphemeris('499', '2024-01-01', '2024-01-31', '1d');

// Planet position
const mars = await solarSystem.getPlanetPosition('mars', '2024-01-01');

// Asteroid data
const eros = await solarSystem.getAsteroidData('433');

// Fireball events (bright meteors)
const fireballs = await solarSystem.getFireballs('2024-01-01', '2024-01-31');

// Close approaches
const approaches = await solarSystem.getCloseApproaches('now', '+60', '0.05');

// Mission data
const missions = await solarSystem.getMissionData('mars');

// Planetary satellites (moons)
const jupiterMoons = await solarSystem.getPlanetarySatellites('jupiter');
```

**Cache TTL:** 1 hour (ephemeris changes slowly)

**API Keys:** None required

**Body IDs:**
- Sun: 10
- Mercury: 199
- Venus: 299
- Mars: 499
- Jupiter: 599
- Saturn: 699
- Uranus: 799
- Neptune: 899
- Pluto: 999
- Moon: 301

---

### 9. EarthClient

Natural events and Earth imagery.

```typescript
const earth = new EarthClient();

// Natural events
const events = await earth.getNaturalEvents('wildfires', 'open', 7);

// Specific event
const event = await earth.getEventById('EONET_5920');

// Event categories
const categories = await earth.getCategories();

// Events by category
const volcanoes = await earth.getEventsByCategory('volcanoes', 'open', 10);

// Earth imagery
const imagery = await earth.getEarthImagery(37.7749, -122.4194, '2024-01-01', 0.025);

// Available imagery dates
const assets = await earth.getEarthAssets(37.7749, -122.4194, '2023-01-01', '2024-01-01');

// Convenience methods
const wildfires = await earth.getWildfires(7);
const volcanic = await earth.getVolcanicActivity(30);
const storms = await earth.getSevereStorms(7);
```

**Cache TTL:** 1 hour

**API Keys:** Requires `NASA_API_KEY` for imagery

**Event Categories:**
- wildfires
- volcanoes
- storms
- floods
- drought
- dustHaze
- snow
- landslides
- seaLakeIce
- earthquakes
- severeStorms

---

## Response Format

All clients return `APIResponse<T>`:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    source: string;
    timestamp: number;
    cached: boolean;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}
```

## Error Handling

```typescript
const result = await nasa.getAPOD('2024-01-01');

if (!result.success) {
  console.error(`Error: ${result.error?.message}`);
  return;
}

// Safe to use result.data
console.log(result.data);
```

## Caching Strategy

Each client uses intelligent caching based on data volatility:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| ISS Position | 5s | Very fast-moving |
| Satellite Position | 60s | Fast-moving |
| Space Weather | 5min | Frequently updated |
| Launches | 5-10min | Schedules change |
| Earth Events | 1hr | Updates periodically |
| Mars Images | 1hr | Static data |
| Exoplanets | 24hr | Static database |
| APOD | 24hr | Daily update |

## Environment Variables

```bash
# Required for NASA APIs (or use DEMO_KEY)
NASA_API_KEY=your_key_here

# Required for satellite tracking (N2YO)
N2YO_API_KEY=your_key_here

# Optional: Space-Track.org for TLE data
SPACE_TRACK_USERNAME=your_username
SPACE_TRACK_PASSWORD=your_password
```

## Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| NASA | 1000/hour | Demo key limited |
| N2YO | 1000/hour | Per API key |
| Launch Library | 15/hour | Free tier |
| SpaceX | None | Public API |
| NOAA SWPC | None | Public data |
| Open Notify | None | Public API |

## Best Practices

1. **Always check `success` field** before accessing `data`
2. **Respect rate limits** - use caching aggressively
3. **Handle errors gracefully** - APIs can be down
4. **Use TypeScript** - full type safety included
5. **Cache appropriately** - don't disable caching for rate-limited APIs

## Examples

### Building a Dashboard

```typescript
async function buildDashboard() {
  const nasa = new NASAClient();
  const iss = new ISSClient();
  const weather = new SpaceWeatherClient();
  const launches = new LaunchClient();

  const [apod, issPos, spaceWeather, nextLaunches] = await Promise.all([
    nasa.getAPOD(),
    iss.getCurrentPosition(),
    weather.getSpaceWeatherSummary(),
    launches.getUpcomingLaunches(5),
  ]);

  return {
    apod: apod.data,
    iss: issPos.data,
    weather: spaceWeather.data,
    launches: nextLaunches.data?.results,
  };
}
```

### Location-Based Features

```typescript
async function getLocationData(lat: number, lon: number) {
  const iss = new ISSClient();
  const satellite = new SatelliteClient();
  const earth = new EarthClient();

  const [issPasses, satellites, events, imagery] = await Promise.all([
    iss.getPassTimes(lat, lon, 0, 5),
    satellite.getSatellitesAbove(lat, lon, 0, 70),
    earth.getNaturalEvents(undefined, 'open', 30),
    earth.getEarthImagery(lat, lon),
  ]);

  return {
    issPasses: issPasses.data,
    visibleSatellites: satellites.data,
    nearbyEvents: events.data,
    imagery: imagery.data,
  };
}
```

## Testing

```typescript
// Mock responses for testing
import { APIResponse } from '@cosmic-atlas/shared';

const mockAPOD: APIResponse<APOD> = {
  success: true,
  data: {
    date: '2024-01-01',
    title: 'Test APOD',
    explanation: 'Test explanation',
    url: 'https://example.com/image.jpg',
    mediaType: 'image',
  },
  metadata: {
    source: 'NASA',
    timestamp: Date.now(),
    cached: false,
  },
};
```

## Support

For issues or questions:
- NASA API: https://api.nasa.gov/
- N2YO: https://www.n2yo.com/api/
- Launch Library: https://thespacedevs.com/
- SpaceX: https://github.com/r-spacex/SpaceX-API
