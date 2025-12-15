# Cosmic Atlas Frontend - Installation & Quick Start

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have:
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

Check your versions:
```bash
node --version
npm --version
```

---

## 📦 Installation Steps

### Step 1: Install Dependencies

From the frontend directory:

```bash
cd /home/ajs/cosmic-atlas/packages/frontend
npm install
```

This will install all dependencies including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Axios
- Socket.IO Client
- and more...

### Step 2: Environment Configuration

Create your environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WebSocket URL
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Step 3: Start Development Server

```bash
npm run dev
```

The application will start on: **http://localhost:3000**

You should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

---

## 🎯 Verify Installation

### Open Your Browser

Navigate to: **http://localhost:3000**

You should see:
- ✨ Cosmic Atlas landing page
- 🌟 Animated stars background
- 📊 Real-time stats counter
- 🎴 6 feature cards (ISS, Space Weather, Mars, etc.)
- 🎨 Space-themed dark design

### Check the Console

Open browser DevTools (F12) and verify:
- No errors in console
- No missing dependencies
- WebSocket connection established (if backend is running)

---

## 🛠️ Development Commands

### Run Development Server
```bash
npm run dev
```
Starts Next.js in development mode with hot reload

### Build for Production
```bash
npm run build
```
Creates optimized production build

### Start Production Server
```bash
npm start
```
Runs production build (after `npm run build`)

### Type Checking
```bash
npm run type-check
```
Checks TypeScript types without emitting files

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality

---

## 🔍 Troubleshooting

### Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors

**Error**: `Module not found: Can't resolve '@/...'`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript Errors

**Error**: Type errors during development

**Solution**:
```bash
# Check all type errors
npm run type-check

# Clear Next.js cache
rm -rf .next
```

### WebSocket Connection Failed

**Error**: `WebSocket connection failed`

**Solution**:
- Ensure backend is running on port 3001
- Check `.env.local` has correct `NEXT_PUBLIC_WS_URL`
- Verify backend WebSocket is enabled

### Tailwind Styles Not Working

**Error**: Styles not applying

**Solution**:
```bash
# Rebuild Tailwind
npm run dev

# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
```

---

## 📁 Project Structure Verification

After installation, verify you have these directories:

```
frontend/
├── app/                  ✓ Next.js App Router
├── components/           ✓ React components
│   ├── Layout/          ✓ Navbar, Footer
│   └── UI/              ✓ Card, Loading, Error
├── hooks/                ✓ Custom React hooks
├── lib/                  ✓ API, WebSocket, Utils
├── types/                ✓ TypeScript definitions
├── public/               ✓ Static assets
├── node_modules/         ✓ Dependencies (after install)
└── .next/                ✓ Build output (after dev/build)
```

Verify files:
```bash
ls -la app/
# Should show: layout.tsx, page.tsx, globals.css

ls -la components/
# Should show: Layout/, UI/, index.ts

ls -la lib/
# Should show: api.ts, websocket.ts, utils.ts

ls -la hooks/
# Should show: useApi.ts, useWebSocket.ts, index.ts
```

---

## 🌐 Backend Connection

### Without Backend Running

The frontend will work but show connection errors for:
- API calls (ISS, Mars, etc.)
- WebSocket real-time updates

**Expected behavior**:
- Landing page loads ✓
- Navigation works ✓
- UI components render ✓
- API calls fail gracefully with error messages

### With Backend Running

Ensure backend is running on port 3001:

```bash
# In a separate terminal
cd /home/ajs/cosmic-atlas/packages/backend
npm install
npm run dev
```

Verify backend:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

---

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and configured
- [ ] Development server starts (`npm run dev`)
- [ ] Landing page loads at http://localhost:3000
- [ ] No console errors in browser
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] (Optional) Backend running on port 3001

---

## 📊 Installation Size

Expected sizes:
- **node_modules**: ~400-500 MB
- **Build output (.next)**: ~50-100 MB
- **Source code**: ~1-2 MB

---

## 🎓 Next Steps

After successful installation:

1. **Explore the Landing Page**
   - Check animated stars background
   - Test responsive navigation
   - Click feature cards

2. **Review the Code**
   - Browse `app/page.tsx` for landing page
   - Check `components/` for UI components
   - Review `lib/api.ts` for API methods

3. **Create Feature Pages**
   - `app/iss/page.tsx` - ISS Tracker
   - `app/space-weather/page.tsx` - Space Weather
   - `app/mars/page.tsx` - Mars Rovers
   - `app/exoplanets/page.tsx` - Exoplanets
   - `app/launches/page.tsx` - Launches
   - `app/apod/page.tsx` - APOD Gallery

4. **Test with Backend**
   - Start backend server
   - Test API calls
   - Verify WebSocket connections

---

## 📚 Documentation

- **README.md** - Project overview
- **SETUP.md** - Detailed setup guide
- **PROJECT_OVERVIEW.md** - Complete feature list
- **INSTALLATION.md** - This file

---

## 🆘 Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check terminal for build errors
3. Verify all dependencies installed
4. Review `.env.local` configuration
5. Try clearing cache: `rm -rf .next node_modules && npm install`

---

## 🎉 Success!

If you see the Cosmic Atlas landing page with:
- Animated stars background ✨
- Gradient "Cosmic Atlas" title
- Real-time stats counter
- 6 feature cards
- Responsive navigation

**Congratulations! Your installation is complete!** 🚀

You're ready to explore the universe through data visualization!

---

Built with ❤️ for space exploration
