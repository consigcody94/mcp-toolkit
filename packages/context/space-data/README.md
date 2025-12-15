# 🌌 Cosmic Atlas

**Comprehensive space data platform aggregating live data from 50+ APIs**

Explore the universe through real-time satellite tracking, ISS monitoring, space weather, Mars rover imagery, exoplanet discoveries, rocket launches, and more—all in one beautiful, production-ready application.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🛰️ **Satellite Tracking**
- **25,000+ satellites** tracked in real-time
- Visual pass predictions for any location
- TLE (Two-Line Element) orbital data
- Integration with N2YO and CelesTrak APIs
- Find satellites overhead at any moment

### 🚀 **ISS Tracker**
- Real-time International Space Station position (5-second updates)
- Pass predictions for ground observations
- Current crew roster with bios
- Live WebSocket streaming

### ☀️ **Space Weather**
- Aurora forecasts (Northern & Southern lights)
- Real-time solar wind data
- Geomagnetic activity (Kp index)
- Solar flares and CME tracking
- 3-day space weather forecasts
- Data from NOAA SWPC + NASA DONKI

### 🔴 **Mars Exploration**
- Browse 500,000+ photos from Mars rovers
- Curiosity, Perseverance, Opportunity, Spirit
- Filter by sol (Martian day), camera, Earth date
- Latest images from the Red Planet

### 🪐 **Asteroids & NEOs**
- Near-Earth Object close approach data
- Potentially hazardous asteroid tracking
- Size, velocity, and miss distance calculations
- Comprehensive orbital data from JPL

### 🌍 **Exoplanet Explorer**
- 5,400+ confirmed exoplanets
- Search by discovery method, size, mass
- Habitable zone filtering
- Stellar system visualization
- NASA Exoplanet Archive integration

### 🚀 **Launch Schedule**
- Upcoming rocket launches worldwide
- SpaceX launch tracking
- All launch providers (ULA, Arianespace, Roscosmos, etc.)
- Mission details and live streams
- Launch Library 2 integration

### 🔭 **Telescope Data**
- Hubble Space Telescope observations
- James Webb Space Telescope data
- Astronomy Picture of the Day (APOD)
- Archive browser

### 🌏 **Earth Observation**
- Real-time natural events (wildfires, storms, volcanoes)
- Landsat 8 imagery for any location
- NASA EONET event tracking

### 🪐 **Solar System**
- Planetary positions and ephemeris data
- Asteroid and comet tracking
- Fireball (meteor) events
- JPL HORIZONS integration

### 📡 **Real-Time Data**
- WebSocket streaming for live updates
- ISS position updated every 5 seconds
- Space weather updates every 5 minutes
- Intelligent caching (5s to 24hr TTLs)

---

## 🏗️ Architecture

```
cosmic-atlas/
├── packages/
│   ├── shared/          # TypeScript types shared across frontend & backend
│   ├── backend/         # Node.js/Express API aggregator
│   │   ├── src/
│   │   │   ├── services/   # 9 API clients (NASA, SpaceX, N2YO, etc.)
│   │   │   ├── routes/     # Express routes (70+ endpoints)
│   │   │   ├── utils/      # Cache manager, API client base class
│   │   │   └── index.ts    # Main server with WebSocket support
│   │   └── package.json
│   └── frontend/        # Next.js 14 application
│       ├── app/            # Next.js App Router pages
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # API client, utilities
│       └── package.json
└── package.json         # Monorepo root
```

### **Tech Stack**

**Backend:**
- Node.js 20+ with TypeScript
- Express.js REST API
- Socket.IO for real-time streaming
- NodeCache for intelligent caching
- Axios for external API calls
- Helmet + CORS for security

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5.3
- Tailwind CSS
- Framer Motion (animations)
- Recharts (data visualization)
- Socket.IO Client (real-time)

**Data Sources (50+ APIs):**
- NASA (APOD, Mars Rovers, NEO, Earth, DONKI, Exoplanets, TechPort)
- N2YO (Satellite tracking)
- CelesTrak (TLE data)
- SpaceX API (Launches, Starlink, rockets)
- Launch Library 2 (All launch providers)
- NOAA SWPC (Space weather, aurora)
- Open Notify (ISS tracking)
- JPL HORIZONS (Solar system ephemeris)
- JPL SBDB (Asteroid database)
- EONET (Earth natural events)
- And many more!

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20+ ([Download](https://nodejs.org/))
- npm or yarn
- Optional: NASA API key ([Get one free](https://api.nasa.gov/))

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/consigcody94/cosmic-atlas.git
   cd cosmic-atlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   **Backend:**
   ```bash
   cd packages/backend
   cp .env.example .env
   ```

   Edit `.env` and add your API keys (optional - uses free tiers/demo keys by default):
   ```env
   NASA_API_KEY=DEMO_KEY
   N2YO_API_KEY=          # Optional
   ```

   **Frontend:**
   ```bash
   cd ../frontend
   cp .env.example .env.local
   ```

4. **Start the backend**
   ```bash
   cd ../backend
   npm run dev
   ```

   Backend will start at `http://localhost:3001`

5. **Start the frontend** (in a new terminal)
   ```bash
   cd ../frontend
   npm run dev
   ```

   Frontend will start at `http://localhost:3000`

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📖 API Documentation

### **Base URL**
```
http://localhost:3001/api
```

### **Endpoints**

#### **NASA**
- `GET /nasa/apod` - Astronomy Picture of the Day
- `GET /nasa/mars/:rover` - Mars rover photos
- `GET /nasa/neo` - Near-Earth Objects
- `GET /nasa/earth/imagery` - Landsat imagery
- `GET /nasa/donki/:eventType` - Space weather events

#### **Satellites**
- `GET /satellites/:noradId/position` - Real-time satellite position
- `GET /satellites/:noradId/passes` - Visual pass predictions
- `GET /satellites/:noradId/tle` - Two-Line Element data
- `GET /satellites/above` - Satellites above location

#### **ISS**
- `GET /iss/position` - Real-time ISS location
- `GET /iss/passes` - ISS pass predictions
- `GET /iss/astronauts` - Current crew

#### **SpaceX**
- `GET /spacex/launches/latest` - Latest launch
- `GET /spacex/launches/next` - Next launch
- `GET /spacex/launches/upcoming` - Upcoming launches
- `GET /spacex/rockets` - All rockets
- `GET /spacex/starlink` - Starlink satellites

#### **Launches**
- `GET /launches/upcoming` - All upcoming launches
- `GET /launches/past` - Past launches
- `GET /launches/:id` - Launch by ID
- `GET /launches/search` - Search launches

#### **Space Weather**
- `GET /space-weather/aurora` - Aurora forecast
- `GET /space-weather/solar-wind` - Solar wind data
- `GET /space-weather/geomagnetic` - Kp index
- `GET /space-weather/forecast` - 3-day forecast
- `GET /space-weather/solar-flares` - Solar flare events
- `GET /space-weather/cmes` - Coronal Mass Ejections

#### **Exoplanets**
- `POST /exoplanets/search` - Search exoplanets
- `GET /exoplanets/:name` - Exoplanet by name
- `GET /exoplanets/stats/summary` - Statistics

#### **Solar System**
- `GET /solar-system/:body/ephemeris` - Ephemeris data
- `GET /solar-system/planets/:planet` - Planet position
- `GET /solar-system/asteroids/:designation` - Asteroid data
- `GET /solar-system/fireballs` - Fireball events

#### **Earth**
- `GET /earth/events` - Natural events
- `GET /earth/events/:id` - Event by ID
- `GET /earth/imagery` - Earth imagery

Full API documentation: `http://localhost:3001/`

---

## 🌐 WebSocket Events

Connect to `ws://localhost:3001`

**Subscribe to real-time streams:**
```javascript
socket.emit('subscribe', ['iss:position', 'spaceWeather:update']);
```

**Events:**
- `iss:position` - ISS location (every 5 seconds)
- `spaceWeather:update` - Space weather (every 5 minutes)

---

## 🎨 Features In Detail

### **Intelligent Caching**
- Fast data: 5 seconds (ISS position)
- Dynamic data: 5 minutes (space weather, launches)
- Hourly data: 1 hour (Mars photos, asteroids)
- Static data: 24 hours (exoplanets, historical)

### **Rate Limit Management**
- Respects all API rate limits
- Automatic retry with exponential backoff
- Fallback APIs (e.g., CelesTrak when N2YO unavailable)
- Rate limit tracking in API responses

### **Error Handling**
- Graceful degradation on API failures
- Cache fallback on errors
- User-friendly error messages
- Production error boundaries

### **Performance**
- Server-side caching (NodeCache)
- Next.js image optimization
- Code splitting and lazy loading
- Production build optimizations

---

## 📊 Data Sources

| API | Data Provided | Update Frequency | Auth Required |
|-----|---------------|------------------|---------------|
| NASA APOD | Astronomy Picture of the Day | Daily | Optional |
| NASA Mars Rovers | Mars surface photos | Real-time | Optional |
| NASA NeoWs | Near-Earth Objects | Hourly | Optional |
| NASA DONKI | Space weather events | Real-time | Optional |
| N2YO | Satellite tracking | Real-time | Yes |
| CelesTrak | TLE orbital data | Daily | No |
| SpaceX API | Launches, rockets, Starlink | Real-time | No |
| Launch Library 2 | Global launch schedule | Real-time | No |
| NOAA SWPC | Space weather | Real-time | No |
| Open Notify | ISS tracking | Real-time | No |
| JPL HORIZONS | Solar system ephemeris | On-demand | No |
| JPL SBDB | Asteroid database | Hourly | No |
| NASA Exoplanet Archive | Exoplanet data | Daily | No |
| NASA EONET | Earth natural events | Real-time | No |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NASA** for their incredible open data APIs
- **N2YO** for satellite tracking
- **SpaceX** for open launch data
- **TheSpaceDevs** for Launch Library 2
- **NOAA** for space weather data
- **JPL** for solar system data
- All the amazing space agencies and organizations making data publicly available

---

## 📧 Contact

**GitHub:** [@consigcody94](https://github.com/consigcody94)

**Repository:** [https://github.com/consigcody94/cosmic-atlas](https://github.com/consigcody94/cosmic-atlas)

---

## 🌟 Star the Project!

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ for space enthusiasts, developers, and data scientists**

*Explore the cosmos, one API call at a time.* 🚀
