# Cosmic Atlas Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies

From the root of the monorepo:
```bash
npm install
```

Or from the frontend directory:
```bash
cd packages/frontend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

## Development Workflow

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # Root layout with Navbar/Footer
│   ├── page.tsx             # Landing page with features
│   └── globals.css          # Global styles + animations
│
├── components/
│   ├── Layout/
│   │   ├── Navbar.tsx       # Responsive navigation
│   │   └── Footer.tsx       # Footer with links
│   └── UI/
│       ├── Card.tsx         # Reusable card components
│       ├── Loading.tsx      # Loading states
│       └── ErrorBoundary.tsx # Error handling
│
├── lib/
│   ├── api.ts               # API client (axios)
│   ├── websocket.ts         # WebSocket client (socket.io)
│   └── utils.ts             # Utility functions
│
├── types/
│   └── index.ts             # TypeScript type definitions
│
└── public/                  # Static assets
```

## Features Implemented

### 1. Landing Page (app/page.tsx)
- Hero section with animated logo
- Real-time stats counter
- 6 feature cards with links:
  - ISS Tracker
  - Space Weather
  - Mars Rovers
  - Exoplanets
  - Launches
  - APOD Gallery
- Call-to-action section

### 2. Layout Components
- **Navbar**: Responsive navigation with mobile menu
- **Footer**: Links to features, resources, and social media

### 3. UI Components
- **Card**: Glassmorphism cards with hover effects
- **StatCard**: Display metrics with trends
- **InfoCard**: Information cards with actions
- **ImageCard**: Image galleries
- **Loading**: Multiple loading variants (spinner, pulse, orbit, dots)
- **ErrorBoundary**: Production-ready error handling

### 4. API Client (lib/api.ts)
Type-safe API methods for:
- ISS tracking
- Space weather
- Mars rovers
- Exoplanets
- Launches
- APOD

### 5. WebSocket Client (lib/websocket.ts)
Real-time subscriptions for:
- ISS position updates
- Space weather updates
- Launch notifications

## Styling

### Theme
- **Dark space theme** with cosmic gradients
- **Colors**:
  - Background: #0a0e27 (space-darkest)
  - Cards: #1a1d3a (space-dark)
  - Accents: Blue (#3b82f6), Purple (#8b5cf6), Cyan (#06b6d4)

### Effects
- Animated stars background
- Glassmorphism cards
- Smooth transitions
- Gradient text
- Glow effects on hover

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Responsive navigation with mobile menu

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component
   - AVIF/WebP formats
   - Lazy loading

2. **Code Splitting**
   - Route-based automatic splitting
   - Dynamic imports for heavy components

3. **Package Optimization**
   - Tree shaking for lucide-react, recharts
   - Minimal bundle size

4. **Rendering**
   - Server-side rendering where beneficial
   - Client components for interactivity

## Browser Support

- Chrome (last 2 versions) ✓
- Firefox (last 2 versions) ✓
- Safari (last 2 versions) ✓
- Edge (last 2 versions) ✓

## Next Steps

### Create Feature Pages

Create these pages in the `app/` directory:

1. **app/iss/page.tsx** - ISS Tracker
2. **app/space-weather/page.tsx** - Space Weather
3. **app/mars/page.tsx** - Mars Rovers
4. **app/exoplanets/page.tsx** - Exoplanets
5. **app/launches/page.tsx** - Launches
6. **app/apod/page.tsx** - APOD Gallery

### Example Page Structure

```tsx
// app/iss/page.tsx
'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, Loading, ErrorMessage } from '@/components'

export default function ISSPage() {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPosition() {
      try {
        const data = await api.iss.getCurrentPosition()
        setPosition(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPosition()
  }, [])

  if (loading) return <Loading fullScreen />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">ISS Tracker</h1>
      {/* Your content */}
    </div>
  )
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Type Errors
```bash
# Check TypeScript errors
npm run type-check
```

## Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

Happy coding! 🚀✨
