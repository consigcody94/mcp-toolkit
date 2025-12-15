import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // API Keys (all optional, using DEMO_KEY as fallback)
  apiKeys: {
    nasa: process.env.NASA_API_KEY || 'DEMO_KEY',
    n2yo: process.env.N2YO_API_KEY || '',
    spaceTrack: {
      username: process.env.SPACE_TRACK_USERNAME || '',
      password: process.env.SPACE_TRACK_PASSWORD || '',
    },
  },

  // Cache settings
  cache: {
    ttl: {
      satellite: 60, // 1 minute (fast-moving)
      iss: 5, // 5 seconds (very fast)
      spaceWeather: 300, // 5 minutes
      mars: 3600, // 1 hour (images don't change often)
      apod: 86400, // 24 hours (updates daily)
      neo: 3600, // 1 hour
      exoplanet: 86400, // 24 hours (static data)
      launch: 300, // 5 minutes (schedules change)
      telescope: 3600, // 1 hour
      earth: 3600, // 1 hour
    },
    checkPeriod: 60, // Check for expired keys every minute
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute per IP
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
};
