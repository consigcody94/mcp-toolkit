# Tarkov Tracker

<div align="center">

![Tarkov Tracker Logo](https://img.shields.io/badge/🎯_Tarkov-Tracker-c7a44a?style=for-the-badge&labelColor=111114)

**An open-source, real-time position tracker for Escape from Tarkov**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Features](#features) • [How It Works](#how-it-works) • [Installation](#installation) • [MCP Integration](#mcp-integration-for-ai-assistants) • [Contributing](#contributing)

</div>

---

## 🎯 What is Tarkov Tracker?

Tarkov Tracker is a **free, open-source alternative** to [TarkovQuestie](https://tarkovquestie.com/). It displays your real-time position on interactive maps while playing Escape from Tarkov.

**100% Safe & Legit** - This tool only reads screenshot filenames. It never touches game memory, files, or network traffic.

### Why Open Source?

- **Transparency** - See exactly how it works, no hidden code
- **Community-driven** - Anyone can contribute improvements
- **Free forever** - No subscriptions, no ads, no data collection
- **Customizable** - Fork it and make it your own
- **Educational** - Learn how EFT embeds coordinates in screenshots

---

## ✨ Features

### Core Features
- 🗺️ **Real-time Position Tracking** - Your position updates automatically on the map
- 🎯 **Player Direction Indicator** - See which way you're facing
- 📍 **Position History Trail** - Track your movement through the raid
- 🔄 **Auto-Screenshot Mode** - Automatically captures position every 1-5 seconds
- 🗑️ **Auto-Cleanup** - Deletes old screenshots to save disk space

### Map Features
- 🚪 **Extracts** - All PMC, Scav, and shared extraction points
- 👥 **Spawn Points** - PMC and Scav spawn locations
- 💀 **Boss Spawns** - Boss locations with spawn chances
- 📦 **Loot Containers** - Crates, weapon boxes, filing cabinets
- 🔑 **Locked Doors** - Key requirements for locked rooms
- 📋 **Quest Items** - Items needed for active quests

### UI Features
- 🌙 **Beautiful Dark Theme** - Glass morphism with gold accents
- 📌 **Always-on-Top** - Overlay on your game
- 🔍 **Adjustable Opacity** - Make it semi-transparent
- 🎨 **Frameless Window** - Clean, modern look
- ⚡ **Fast & Lightweight** - Minimal resource usage

### 10 Maps Supported
Customs, Woods, Shoreline, Interchange, Reserve, Lighthouse, Streets of Tarkov, Ground Zero, The Lab, Factory

---

## 🔬 How It Works

### The Screenshot Coordinate System

When you press **PrintScreen** in Escape from Tarkov, the game saves a screenshot with your **exact coordinates embedded in the filename**:

```
2025-12-04[15-32]_152.34, 2.89, -203.45_-0.02, -0.86, 0.04, -0.51_12.5 (0).png
│         │       │       │     │       │                        │
│         │       │       │     │       │                        └─ Additional data
│         │       │       │     │       └─ Quaternion rotation (qx, qy, qz, qw)
│         │       │       │     └─ Z coordinate (horizontal axis)
│         │       │       └─ Y coordinate (vertical/height)
│         │       └─ X coordinate (horizontal axis)
│         └─ Time [HH-MM]
└─ Date YYYY-MM-DD
```

### Coordinate Breakdown

| Component | Example | Description |
|-----------|---------|-------------|
| Date | `2025-12-04` | When screenshot was taken |
| Time | `[15-32]` | Hour and minute |
| X | `152.34` | East-West position in game units |
| Y | `2.89` | Height/elevation |
| Z | `-203.45` | North-South position in game units |
| qx | `-0.02` | Quaternion X component |
| qy | `-0.86` | Quaternion Y component |
| qz | `0.04` | Quaternion Z component |
| qw | `-0.51` | Quaternion W component |

### Quaternion to Direction Conversion

The game stores your facing direction as a [quaternion](https://en.wikipedia.org/wiki/Quaternion). We convert it to a yaw angle (compass heading):

```javascript
function quaternionToYaw(qx, qy, qz, qw) {
  const siny_cosp = 2.0 * (qw * qy + qx * qz);
  const cosy_cosp = 1.0 - 2.0 * (qy * qy + qz * qz);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);
  return yaw * (180.0 / Math.PI); // Convert to degrees
}
```

### Coordinate to Map Pixel Conversion

Game coordinates need to be transformed to map image pixels. Each map has different scaling:

```javascript
// Example for Customs
const gameToMapPixel = (gameX, gameZ) => {
  // Map images are centered at (0,0) with specific scale factors
  const mapX = gameZ * 1.5; // Scale factor varies per map
  const mapY = gameX * 1.5;
  return [mapX, mapY];
};
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TARKOV TRACKER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Electron  │     │   Chokidar  │     │  Leaflet.js │       │
│  │    Main     │────▶│   Watcher   │────▶│     Map     │       │
│  │   Process   │     │             │     │   Renderer  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                   │                   ▲               │
│         │                   │                   │               │
│         ▼                   ▼                   │               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  PowerShell │     │   Regex     │     │  tarkov.dev │       │
│  │  SendKeys   │     │   Parser    │────▶│     API     │       │
│  │  (Auto-SS)  │     │             │     │             │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### File Watcher Flow

```
1. User presses PrintScreen (or Auto-Screenshot triggers it)
         │
         ▼
2. EFT saves screenshot to: Documents/Escape From Tarkov/Screenshots/
         │
         ▼
3. Chokidar detects new file
         │
         ▼
4. Regex extracts coordinates from filename:
   /\d{4}-\d{2}-\d{2}\[\d{2}-\d{2}\]_(?<x>-?[\d.]+),\s*(?<y>-?[\d.]+),\s*(?<z>-?[\d.]+)_(?<qx>-?[\d.]+),\s*(?<qy>-?[\d.]+),\s*(?<qz>-?[\d.]+),\s*(?<qw>-?[\d.]+)/
         │
         ▼
5. Convert quaternion to yaw (facing direction)
         │
         ▼
6. Send position via IPC to renderer
         │
         ▼
7. Update Leaflet map marker
         │
         ▼
8. Delete previous screenshot (if auto-mode)
```

---

## 📦 Installation

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Windows 10/11** - Required for EFT
- **Escape from Tarkov** - Game must be installed

### Option 1: Download Release (Easiest)

1. Go to [Releases](../../releases)
2. Download `TarkovTracker-Setup.exe`
3. Run installer or use portable version
4. Launch and start playing!

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tarkov-tracker.git
cd tarkov-tracker

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

The built application will be in the `release/` folder.

### First-Time Setup

1. **Take a screenshot in EFT first** - This creates the Screenshots folder
2. **Launch Tarkov Tracker**
3. **Select your map** from the top bar
4. **Enable Auto-Tracking** (optional) - Click the camera icon
5. **Play the game!** - Your position updates automatically

---

## 🎮 Usage Guide

### Basic Controls

| Control | Description |
|---------|-------------|
| **Map Buttons** | Switch between maps |
| **Auto Button** | Toggle automatic screenshot capture |
| **Interval Dropdown** | Set auto-screenshot interval (1-5 seconds) |
| **Opacity Slider** | Adjust window transparency |
| **Pin Button** | Toggle always-on-top |
| **Filters Button** | Show/hide map markers |

### Auto-Screenshot Mode

When enabled, the app automatically:
1. Simulates pressing PrintScreen every X seconds
2. Captures your new position
3. Deletes the old screenshot
4. Updates the map

**Note:** EFT must be the focused window for auto-screenshots to capture coordinates.

### Filter Options

Toggle visibility of:
- 🚪 Extracts (PMC, Scav, Shared)
- 🎯 Spawn Points
- 💀 Boss Spawns
- 📦 Loot Containers
- 🔑 Locked Doors
- 📋 Quest Items

---

## 🤖 MCP Integration for AI Assistants

Tarkov Tracker includes an **MCP (Model Context Protocol) server** that allows AI assistants like Claude to interact with the tracker in real-time!

### What Can the MCP Server Do?

- 📍 **Get current position** - "Where am I on the map?"
- 🗺️ **Get map info** - "What extracts are nearby?"
- 🎯 **Find objectives** - "Where's the closest quest item?"
- 📊 **Analyze raid** - "Show me my movement path"
- 💀 **Boss alerts** - "Am I near a boss spawn?"

### Setting Up MCP Integration

1. **Start the MCP server** (runs alongside the main app):

```bash
npm run mcp-server
```

2. **Configure Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tarkov-tracker": {
      "command": "node",
      "args": ["path/to/tarkov-tracker/mcp-server/index.js"],
      "env": {}
    }
  }
}
```

3. **Ask Claude about your raid!**

### Example Conversations

```
You: "Where am I right now in Tarkov?"
Claude: "You're on Customs at coordinates X: 152, Z: -203.
        You're near the Big Red warehouse area. The closest
        extract is ZB-1011 (320m north)."

You: "Is there a boss nearby?"
Claude: "Reshala has a 38% chance to spawn at Dorms, which is
        about 180m from your current position. Be careful!"

You: "What's the safest path to extract?"
Claude: "Based on your position history, I'd recommend heading
        east to avoid the high-traffic Dorms area. RUAF Roadblock
        is 450m away with minimal cover but fewer player spawns."
```

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `get_position` | Get current player position and direction |
| `get_map` | Get current map name and metadata |
| `get_history` | Get position history for the raid |
| `get_nearby_extracts` | List extracts sorted by distance |
| `get_nearby_bosses` | Check boss spawn locations nearby |
| `get_quest_items` | Find quest objectives on current map |
| `calculate_distance` | Distance between two points |
| `suggest_route` | AI-powered route suggestions |

---

## 🏗️ Technical Details

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron 28** | Desktop application framework |
| **React 18** | UI component library |
| **TypeScript 5** | Type-safe JavaScript |
| **Vite 5** | Fast build tool |
| **Tailwind CSS 3** | Utility-first styling |
| **Zustand** | State management |
| **Leaflet** | Interactive maps |
| **Chokidar** | File system watcher |
| **MCP SDK** | AI assistant integration |

### Project Structure

```
tarkov-tracker/
├── electron/               # Electron main process
│   └── main.js            # Window management, file watcher, IPC
├── mcp-server/            # MCP server for AI integration
│   ├── index.js           # Server entry point
│   └── tools/             # MCP tool implementations
├── src/
│   └── renderer/          # React frontend
│       ├── components/    # UI components
│       │   ├── TitleBar.tsx
│       │   ├── MapSelector.tsx
│       │   ├── MapView.tsx
│       │   ├── FilterPanel.tsx
│       │   └── StatusBar.tsx
│       ├── store.ts       # Zustand state management
│       ├── App.tsx        # Main app component
│       ├── main.tsx       # React entry point
│       └── globals.css    # Tailwind + custom styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Key Files Explained

#### `electron/main.js`
The main process handles:
- Creating the frameless, transparent window
- Watching the Screenshots folder with Chokidar
- Parsing coordinates with regex
- Converting quaternions to yaw
- Auto-screenshot with PowerShell SendKeys
- IPC communication with renderer

#### `src/renderer/components/MapView.tsx`
The map component handles:
- Initializing Leaflet with custom CRS
- Loading map images as overlays
- Fetching data from tarkov.dev API
- Rendering markers for extracts, spawns, etc.
- Updating player position marker
- Drawing position history trail

#### `src/renderer/store.ts`
Zustand store manages:
- Current map selection
- Player position and history
- Filter toggles
- Auto-screenshot settings
- Window controls (opacity, always-on-top)

### Data Sources

| Source | Data Provided |
|--------|---------------|
| **EFT Screenshots** | Player position, rotation |
| **tarkov.dev API** | Extracts, spawns, bosses, loot, quests |
| **Map Images** | tarkov.dev CDN |

### API Integration

We use the [tarkov.dev GraphQL API](https://api.tarkov.dev/):

```graphql
{
  maps {
    id
    name
    normalizedName
    spawns {
      position { x y z }
      sides
      categories
    }
    extracts {
      name
      position { x y z }
      faction
    }
    bosses {
      name
      spawnLocations {
        name
        position { x y z }
        chance
      }
    }
    lootContainers {
      position { x y z }
      name
    }
  }
}
```

---

## 🔧 Configuration

### Map Calibration

If markers appear offset, adjust the `gameToMap` function in `MapView.tsx`:

```typescript
const MAP_CONFIG = {
  customs: {
    // Adjust these values to calibrate
    gameToMap: (x, z) => [z * 1.5, x * 1.5],
    bounds: [[-1000, -1000], [1000, 1000]],
    center: [0, 0],
  },
  // ... other maps
};
```

### Screenshots Folder

Default location:
```
C:\Users\{USERNAME}\Documents\Escape From Tarkov\Screenshots
```

The app will create this folder if it doesn't exist.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- 🐛 **Report bugs** - Open an issue
- 💡 **Suggest features** - Open a discussion
- 🗺️ **Improve map calibration** - Submit PRs with better scaling
- 🌐 **Add translations** - Help localize the app
- 📖 **Improve docs** - Fix typos, add examples
- 🧪 **Write tests** - Increase coverage

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/tarkov-tracker.git
cd tarkov-tracker

# Install dependencies
npm install

# Start development
npm run electron:dev

# Run MCP server (separate terminal)
npm run mcp-server
```

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

**TL;DR:** Do whatever you want with this code. Credit appreciated but not required.

---

## 🙏 Credits

- **Map Images** - [tarkov.dev](https://tarkov.dev) (open source)
- **Game Data API** - [tarkov.dev API](https://api.tarkov.dev)
- **Coordinate Parsing** - Inspired by [TarkovMonitor](https://github.com/the-hideout/TarkovMonitor)
- **Original Concept** - [TarkovQuestie](https://tarkovquestie.com)

---

## ⚠️ Disclaimer

This project is not affiliated with Battlestate Games. Escape from Tarkov is a trademark of Battlestate Games Ltd.

This tool only reads screenshot filenames - it does not:
- Read game memory
- Modify game files
- Intercept network traffic
- Provide any unfair advantage

Use at your own discretion. We are not responsible for any actions taken by BSG.

---

<div align="center">

**Made with ❤️ by the Tarkov community**

[⭐ Star this repo](../../stargazers) • [🐛 Report Bug](../../issues) • [💡 Request Feature](../../issues)

</div>
