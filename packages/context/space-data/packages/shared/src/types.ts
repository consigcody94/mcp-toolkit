/**
 * Cosmic Atlas - Comprehensive Space Data Types
 * Unified type system for 50+ space data APIs
 */

// ============================================================================
// SATELLITE TRACKING
// ============================================================================

export interface Satellite {
  id: string;
  name: string;
  noradId: number;
  intlDesignator?: string;
  launchDate?: string;
  category?: string;
  position?: SatellitePosition;
  tle?: TLE;
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
  timestamp: number;
  azimuth?: number;
  elevation?: number;
  range?: number; // km from observer
}

export interface TLE {
  line1: string;
  line2: string;
  epoch: string;
}

export interface VisualPass {
  startTime: number;
  endTime: number;
  duration: number; // seconds
  maxElevation: number; // degrees
  startAzimuth: number;
  maxAzimuth: number;
  endAzimuth: number;
  magnitude: number;
}

// ============================================================================
// ISS TRACKING
// ============================================================================

export interface ISSLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
  visibility: 'daylight' | 'eclipse';
  footprint: number; // visibility radius in km
}

export interface Astronaut {
  name: string;
  craft: string;
  country?: string;
  launchDate?: string;
  bio?: string;
  imageUrl?: string;
}

export interface ISSPassPrediction {
  location: {
    latitude: number;
    longitude: number;
  };
  passes: VisualPass[];
}

// ============================================================================
// SPACE WEATHER
// ============================================================================

export interface SpaceWeather {
  timestamp: number;
  solarWind?: SolarWind;
  geomagneticActivity?: GeomagneticActivity;
  auroraForecast?: AuroraForecast;
  solarFlares?: SolarFlare[];
  cmes?: CoronalMassEjection[];
}

export interface SolarWind {
  speed: number; // km/s
  density: number; // particles/cm³
  temperature: number; // Kelvin
  bz: number; // nT (southward magnetic field)
  bt: number; // nT (total magnetic field)
  timestamp: number;
}

export interface GeomagneticActivity {
  kpIndex: number; // 0-9
  kpIndexForecast: number[];
  stormLevel: 'none' | 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  timestamp: number;
}

export interface AuroraForecast {
  timestamp: number;
  hemisphere: 'north' | 'south';
  forecast: 'low' | 'moderate' | 'high' | 'very-high';
  coordinates: Array<{ lat: number; lon: number; probability: number }>;
}

export interface SolarFlare {
  id: string;
  classType: string; // A, B, C, M, X
  peakTime: number;
  location: string;
  region: number;
}

export interface CoronalMassEjection {
  id: string;
  startTime: number;
  speed: number; // km/s
  halfAngle: number;
  latitude: number;
  longitude: number;
  catalog: string;
  earthImpact?: {
    estimated: boolean;
    arrivalTime?: number;
  };
}

// ============================================================================
// MARS ROVERS
// ============================================================================

export interface MarsRover {
  id: number;
  name: string;
  landingDate: string;
  launchDate: string;
  status: 'active' | 'complete';
  maxSol: number;
  maxDate: string;
  totalPhotos: number;
  cameras: RoverCamera[];
}

export interface RoverCamera {
  id: number;
  name: string;
  roverId: number;
  fullName: string;
}

export interface RoverPhoto {
  id: number;
  sol: number;
  camera: {
    id: number;
    name: string;
    fullName: string;
  };
  imgSrc: string;
  earthDate: string;
  rover: {
    id: number;
    name: string;
    status: string;
  };
}

// ============================================================================
// ASTEROIDS & NEOs
// ============================================================================

export interface NearEarthObject {
  id: string;
  name: string;
  designation: string;
  nasaJplUrl: string;
  absoluteMagnitude: number;
  estimatedDiameter: {
    kilometers: {
      min: number;
      max: number;
    };
    meters: {
      min: number;
      max: number;
    };
  };
  isPotentiallyHazardous: boolean;
  closeApproachData: CloseApproach[];
  orbitalData?: OrbitalData;
}

export interface CloseApproach {
  closeApproachDate: string;
  epochDateCloseApproach: number;
  relativeVelocity: {
    kilometersPerSecond: string;
    kilometersPerHour: string;
    milesPerHour: string;
  };
  missDistance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbitingBody: string;
}

export interface OrbitalData {
  orbitId: string;
  orbitDeterminationDate: string;
  firstObservationDate: string;
  lastObservationDate: string;
  dataArc: number;
  observationsUsed: number;
  orbitUncertainty: string;
  minimumOrbitIntersection: string;
  jupiterTisserandInvariant: string;
  eccentricity: string;
  semiMajorAxis: string;
  inclination: string;
  ascendingNodeLongitude: string;
  orbitalPeriod: string;
  perihelionDistance: string;
  perihelionArgument: string;
  aphelionDistance: string;
  perihelionTime: string;
  meanAnomaly: string;
}

// ============================================================================
// EXOPLANETS
// ============================================================================

export interface Exoplanet {
  name: string;
  hostName: string;
  discoveryMethod: string;
  discoveryYear: number;
  discoveryFacility?: string;
  orbitalPeriod: number; // days
  semiMajorAxis: number; // AU
  eccentricity?: number;
  planetRadius: number; // Earth radii
  planetMass?: number; // Earth masses
  equilibriumTemperature?: number; // Kelvin
  stellarMagnitude?: number;
  stellarDistance: number; // parsecs
  stellarMass?: number; // Solar masses
  stellarRadius?: number; // Solar radii
  stellarEffectiveTemperature?: number; // Kelvin
}

// ============================================================================
// LAUNCHES
// ============================================================================

export interface Launch {
  id: string;
  name: string;
  status: {
    id: number;
    name: string;
    abbrev: string;
    description: string;
  };
  net: string; // No Earlier Than (launch time)
  windowStart: string;
  windowEnd: string;
  rocket: {
    id: number;
    configuration: {
      id: number;
      name: string;
      family: string;
      fullName: string;
      variant: string;
    };
  };
  mission?: {
    id: number;
    name: string;
    description: string;
    type: string;
    orbit?: {
      id: number;
      name: string;
      abbrev: string;
    };
  };
  pad: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    location: {
      id: number;
      name: string;
      countryCode: string;
    };
  };
  webcastLive: boolean;
  image?: string;
  infographic?: string;
  program?: Array<{
    id: number;
    name: string;
  }>;
}

// ============================================================================
// TELESCOPE DATA
// ============================================================================

export interface TelescopeObservation {
  id: string;
  telescope: string;
  target: string;
  ra: number; // Right Ascension
  dec: number; // Declination
  filters?: string[];
  exposureTime?: number;
  observationDate: string;
  proposalId?: string;
  dataUrl?: string;
  previewUrl?: string;
}

// ============================================================================
// APOD (Astronomy Picture of the Day)
// ============================================================================

export interface APOD {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  mediaType: 'image' | 'video';
  copyright?: string;
  thumbnailUrl?: string;
}

// ============================================================================
// EARTH OBSERVATION
// ============================================================================

export interface NaturalEvent {
  id: string;
  title: string;
  description?: string;
  link?: string;
  categories: Array<{
    id: string;
    title: string;
  }>;
  sources: Array<{
    id: string;
    url: string;
  }>;
  geometry: Array<{
    date: string;
    type: string;
    coordinates: number[];
  }>;
  closed?: string;
}

export interface EarthImagery {
  id: string;
  date: string;
  url: string;
  cloudScore?: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// SOLAR SYSTEM
// ============================================================================

export interface CelestialBody {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'asteroid' | 'comet' | 'spacecraft';
  ephemeris?: Ephemeris;
  physicalData?: PhysicalData;
}

export interface Ephemeris {
  timestamp: number;
  position: {
    x: number; // AU
    y: number; // AU
    z: number; // AU
  };
  velocity: {
    vx: number; // AU/day
    vy: number; // AU/day
    vz: number; // AU/day
  };
  ra?: number; // Right Ascension (degrees)
  dec?: number; // Declination (degrees)
  distance?: number; // AU from observer
  lightTime?: number; // minutes
}

export interface PhysicalData {
  mass?: number; // kg
  radius?: number; // km
  density?: number; // g/cm³
  gravity?: number; // m/s²
  rotationPeriod?: number; // hours
  orbitalPeriod?: number; // days
  albedo?: number;
  surfaceTemperature?: number; // Kelvin
}

// ============================================================================
// STARLINK
// ============================================================================

export interface StarlinkSatellite {
  id: string;
  version: string;
  launchDate: string;
  longitude: number;
  latitude: number;
  altitude: number; // km
  velocity: number; // km/s
  spaceTrack: {
    id: string;
    version: string;
    launchDate: string;
    decayed: boolean;
  };
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface APIResponse<T> {
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface LocationQuery {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SatelliteQuery extends LocationQuery {
  noradId?: number;
  category?: string;
  searchRadius?: number; // degrees
}

export interface ExoplanetQuery extends PaginationQuery {
  discoveryMethod?: string;
  minRadius?: number;
  maxRadius?: number;
  minMass?: number;
  maxMass?: number;
  discoveryYear?: number;
}

export interface NEOQuery extends DateRangeQuery, PaginationQuery {
  onlyHazardous?: boolean;
}

export interface LaunchQuery extends PaginationQuery {
  status?: string;
  lsp?: string; // Launch Service Provider
  upcoming?: boolean;
}
