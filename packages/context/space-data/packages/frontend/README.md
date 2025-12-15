# Cosmic Atlas Frontend

A stunning Next.js 14 application for exploring the universe through real-time space data visualization.

## Features

- **ISS Tracker** - Real-time International Space Station tracking with live telemetry
- **Space Weather** - Monitor solar activity and geomagnetic storms
- **Mars Rovers** - Browse the latest images from NASA Mars rovers
- **Exoplanets** - Discover thousands of planets beyond our solar system
- **Launches** - Stay updated with upcoming and past space launches
- **APOD Gallery** - NASA Astronomy Picture of the Day archive

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Axios** - API client
- **Socket.IO** - Real-time data streaming

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── Layout/          # Layout components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── UI/              # Reusable UI components
│       ├── Card.tsx
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   └── api.ts           # API client
└── public/              # Static assets
```

## Styling

The application uses a custom space theme with:

- **Dark backgrounds** - Deep space colors (#0a0e27, #1a1d3a)
- **Accent colors** - Blue (#3b82f6), Purple (#8b5cf6), Cyan (#06b6d4)
- **Glassmorphism** - Frosted glass card effects
- **Animations** - Smooth transitions and cosmic effects
- **Responsive** - Mobile-first design

## API Integration

The frontend connects to the Cosmic Atlas backend API:

```typescript
import api from '@/lib/api'

// Example: Get ISS position
const position = await api.iss.getCurrentPosition()

// Example: Get Mars photos
const photos = await api.mars.getLatestPhotos('curiosity')
```

## Performance

- **Image Optimization** - Next.js Image component with AVIF/WebP
- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Optimized package imports
- **SSR/SSG** - Server-side rendering where beneficial

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- NASA for providing amazing space data APIs
- ESA, SpaceX, and other space agencies
- The open-source community

---

Built with ❤️ for space exploration
