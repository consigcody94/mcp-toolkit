import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from './config';
import routes from './routes';
import { ISSClient } from './services/iss';
import { SpaceWeatherClient } from './services/spaceWeather';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  },
});

// Initialize real-time clients
const issClient = new ISSClient();
const spaceWeatherClient = new SpaceWeatherClient();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Cosmic Atlas API',
    version: '1.0.0',
    description: 'Comprehensive space data aggregation platform',
    endpoints: {
      nasa: {
        apod: '/api/nasa/apod',
        mars: '/api/nasa/mars/:rover',
        neo: '/api/nasa/neo',
        earth: '/api/nasa/earth/imagery',
        donki: '/api/nasa/donki/:eventType',
      },
      satellites: {
        position: '/api/satellites/:noradId/position',
        passes: '/api/satellites/:noradId/passes',
        tle: '/api/satellites/:noradId/tle',
        above: '/api/satellites/above',
      },
      iss: {
        position: '/api/iss/position',
        passes: '/api/iss/passes',
        astronauts: '/api/iss/astronauts',
      },
      spacex: {
        latestLaunch: '/api/spacex/launches/latest',
        nextLaunch: '/api/spacex/launches/next',
        upcomingLaunches: '/api/spacex/launches/upcoming',
        rockets: '/api/spacex/rockets',
        starlink: '/api/spacex/starlink',
        capsules: '/api/spacex/capsules',
      },
      launches: {
        upcoming: '/api/launches/upcoming',
        past: '/api/launches/past',
        byId: '/api/launches/:id',
        search: '/api/launches/search',
      },
      spaceWeather: {
        aurora: '/api/space-weather/aurora',
        solarWind: '/api/space-weather/solar-wind',
        geomagnetic: '/api/space-weather/geomagnetic',
        forecast: '/api/space-weather/forecast',
        solarFlares: '/api/space-weather/solar-flares',
        cmes: '/api/space-weather/cmes',
      },
      exoplanets: {
        search: '/api/exoplanets/search',
        byName: '/api/exoplanets/:name',
        stats: '/api/exoplanets/stats/summary',
      },
      solarSystem: {
        ephemeris: '/api/solar-system/:body/ephemeris',
        planetPosition: '/api/solar-system/planets/:planet',
        asteroidData: '/api/solar-system/asteroids/:designation',
        fireballs: '/api/solar-system/fireballs',
      },
      earth: {
        events: '/api/earth/events',
        eventById: '/api/earth/events/:id',
        imagery: '/api/earth/imagery',
      },
    },
    websocket: {
      namespace: '/',
      events: {
        subscribe: 'subscribe',
        issPosition: 'iss:position',
        spaceWeather: 'spaceWeather:update',
      },
    },
    documentation: 'https://github.com/consigcody94/cosmic-atlas',
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    },
  });
});

// ============================================================================
// WEBSOCKET - REAL-TIME DATA STREAMS
// ============================================================================

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Track active subscriptions
  const subscriptions = new Set<string>();

  // Subscribe to real-time data streams
  socket.on('subscribe', (channels: string[]) => {
    channels.forEach((channel) => {
      subscriptions.add(channel);
      socket.join(channel);
      console.log(`[WebSocket] ${socket.id} subscribed to ${channel}`);
    });
  });

  // Unsubscribe
  socket.on('unsubscribe', (channels: string[]) => {
    channels.forEach((channel) => {
      subscriptions.delete(channel);
      socket.leave(channel);
      console.log(`[WebSocket] ${socket.id} unsubscribed from ${channel}`);
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Real-time ISS tracking (5-second updates)
setInterval(async () => {
  if (io.sockets.adapter.rooms.has('iss:position')) {
    const position = await issClient.getCurrentPosition();
    if (position.success) {
      io.to('iss:position').emit('iss:position', position.data);
    }
  }
}, 5000);

// Space weather updates (5-minute updates)
setInterval(async () => {
  if (io.sockets.adapter.rooms.has('spaceWeather:update')) {
    const [aurora, solarWind, geomagnetic] = await Promise.all([
      spaceWeatherClient.getAuroraForecast(),
      spaceWeatherClient.getSolarWind(),
      spaceWeatherClient.getGeomagneticActivity(),
    ]);

    if (aurora.success || solarWind.success || geomagnetic.success) {
      io.to('spaceWeather:update').emit('spaceWeather:update', {
        aurora: aurora.data,
        solarWind: solarWind.data,
        geomagnetic: geomagnetic.data,
        timestamp: Date.now(),
      });
    }
  }
}, 5 * 60 * 1000);

// Start server
httpServer.listen(config.port, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              🌌 COSMIC ATLAS API SERVER 🌌               ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Environment:     ${config.nodeEnv}`);
  console.log(`  HTTP Server:     http://localhost:${config.port}`);
  console.log(`  WebSocket:       ws://localhost:${config.port}`);
  console.log(`  API Docs:        http://localhost:${config.port}/`);
  console.log('');
  console.log('  Data Sources:    50+ APIs');
  console.log('  Endpoints:       70+');
  console.log('  Real-time:       ISS tracking, Space weather');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

export { app, httpServer, io };
