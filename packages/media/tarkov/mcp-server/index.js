#!/usr/bin/env node

/**
 * Tarkov Tracker MCP Server
 *
 * This MCP server allows AI assistants like Claude to interact with
 * Tarkov Tracker in real-time. It provides tools to:
 * - Get current player position
 * - Find nearby extracts, bosses, and quest items
 * - Analyze raid movement patterns
 * - Calculate distances and suggest routes
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Shared state file path (written by Electron app)
const STATE_FILE = path.join(os.tmpdir(), 'tarkov-tracker-state.json');

// Map data cache
let mapDataCache = null;

/**
 * Read current state from shared file
 */
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read state:', err);
  }
  return {
    currentMap: 'customs',
    position: null,
    positionHistory: [],
    status: { watching: false }
  };
}

/**
 * Fetch map data from tarkov.dev API
 */
async function fetchMapData() {
  if (mapDataCache) return mapDataCache;

  try {
    const response = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          maps {
            id
            name
            normalizedName
            description
            enemies
            raidDuration
            spawns { position { x y z } sides categories zoneName }
            extracts { name position { x y z } faction }
            bosses { name spawnChance spawnLocations { name position { x y z } chance } }
            lootContainers { position { x y z } name }
          }
        }`
      })
    });
    const data = await response.json();
    mapDataCache = {};
    data.data.maps.forEach(m => {
      mapDataCache[m.normalizedName] = m;
    });
    return mapDataCache;
  } catch (err) {
    console.error('Failed to fetch map data:', err);
    return {};
  }
}

/**
 * Calculate distance between two 3D points
 */
function calculateDistance(p1, p2) {
  if (!p1 || !p2) return Infinity;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Get compass direction from yaw angle
 */
function yawToCompass(yaw) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((yaw + 180) % 360) / 45) % 8;
  return directions[index];
}

/**
 * Format position for display
 */
function formatPosition(pos) {
  if (!pos) return 'Unknown';
  return `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
}

// Create MCP server
const server = new Server(
  {
    name: 'tarkov-tracker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_position',
        description: 'Get the current player position, facing direction, and map in Escape from Tarkov',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_map_info',
        description: 'Get information about the current map including raid duration, enemies, and description',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_position_history',
        description: 'Get the position history trail showing player movement during the raid',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of positions to return (default: 20)'
            }
          },
          required: []
        }
      },
      {
        name: 'get_nearby_extracts',
        description: 'Find extraction points near the current player position, sorted by distance',
        inputSchema: {
          type: 'object',
          properties: {
            faction: {
              type: 'string',
              description: 'Filter by faction: pmc, scav, or shared',
              enum: ['pmc', 'scav', 'shared', 'all']
            },
            limit: {
              type: 'number',
              description: 'Maximum number of extracts to return (default: 5)'
            }
          },
          required: []
        }
      },
      {
        name: 'get_nearby_bosses',
        description: 'Check for boss spawn locations near the current player position',
        inputSchema: {
          type: 'object',
          properties: {
            radius: {
              type: 'number',
              description: 'Search radius in game units (default: 200)'
            }
          },
          required: []
        }
      },
      {
        name: 'get_nearby_loot',
        description: 'Find loot containers (crates, weapon boxes, etc.) near current position',
        inputSchema: {
          type: 'object',
          properties: {
            radius: {
              type: 'number',
              description: 'Search radius in game units (default: 50)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of containers to return (default: 10)'
            }
          },
          required: []
        }
      },
      {
        name: 'calculate_distance_to',
        description: 'Calculate the distance from current position to a specific coordinate',
        inputSchema: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'Target X coordinate' },
            y: { type: 'number', description: 'Target Y coordinate' },
            z: { type: 'number', description: 'Target Z coordinate' }
          },
          required: ['x', 'z']
        }
      },
      {
        name: 'analyze_movement',
        description: 'Analyze player movement patterns from position history',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_spawn_info',
        description: 'Get information about spawn points on the current map',
        inputSchema: {
          type: 'object',
          properties: {
            side: {
              type: 'string',
              description: 'Filter by spawn side: pmc, scav, or all',
              enum: ['pmc', 'scav', 'all']
            }
          },
          required: []
        }
      },
      {
        name: 'suggest_extract_route',
        description: 'Suggest the best extraction route based on current position and player type',
        inputSchema: {
          type: 'object',
          properties: {
            playerType: {
              type: 'string',
              description: 'Player type: pmc or scav',
              enum: ['pmc', 'scav']
            },
            avoidBosses: {
              type: 'boolean',
              description: 'Whether to avoid known boss spawn areas'
            }
          },
          required: []
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const state = readState();
  const mapData = await fetchMapData();
  const currentMapData = mapData[state.currentMap];

  switch (name) {
    case 'get_position': {
      if (!state.position) {
        return {
          content: [{
            type: 'text',
            text: `No position data available. The player hasn't taken a screenshot yet or Tarkov Tracker isn't running.\n\nCurrent map: ${state.currentMap}\nStatus: ${state.status.watching ? 'Watching for screenshots' : 'Not watching'}`
          }]
        };
      }

      const compass = yawToCompass(state.position.rotation);
      return {
        content: [{
          type: 'text',
          text: `**Current Position in Escape from Tarkov**\n\n` +
                `Map: ${currentMapData?.name || state.currentMap}\n` +
                `Position: ${formatPosition(state.position)}\n` +
                `Facing: ${compass} (${state.position.rotation.toFixed(1)}°)\n` +
                `Height: ${state.position.y.toFixed(1)}m\n` +
                `Last Updated: ${new Date(state.position.timestamp).toLocaleTimeString()}\n\n` +
                `Position History: ${state.positionHistory.length} points tracked`
        }]
      };
    }

    case 'get_map_info': {
      if (!currentMapData) {
        return {
          content: [{
            type: 'text',
            text: `Map "${state.currentMap}" data not available.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `**${currentMapData.name}**\n\n` +
                `${currentMapData.description || 'No description available.'}\n\n` +
                `Raid Duration: ${currentMapData.raidDuration} minutes\n` +
                `Enemies: ${currentMapData.enemies?.join(', ') || 'Unknown'}\n` +
                `Extracts: ${currentMapData.extracts?.length || 0}\n` +
                `Boss Spawns: ${currentMapData.bosses?.length || 0}\n` +
                `Spawn Points: ${currentMapData.spawns?.length || 0}`
        }]
      };
    }

    case 'get_position_history': {
      const limit = args?.limit || 20;
      const history = state.positionHistory.slice(-limit);

      if (history.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No position history available yet. Take some screenshots to build a trail!'
          }]
        };
      }

      let totalDistance = 0;
      for (let i = 1; i < history.length; i++) {
        totalDistance += calculateDistance(history[i - 1], history[i]);
      }

      const historyText = history.map((pos, i) =>
        `${i + 1}. ${formatPosition(pos)} at ${new Date(pos.timestamp).toLocaleTimeString()}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `**Position History (${history.length} points)**\n\n` +
                `Total Distance Traveled: ${totalDistance.toFixed(1)} units\n\n` +
                historyText
        }]
      };
    }

    case 'get_nearby_extracts': {
      if (!state.position || !currentMapData?.extracts) {
        return {
          content: [{
            type: 'text',
            text: 'Cannot find extracts: No position data or map data available.'
          }]
        };
      }

      const faction = args?.faction || 'all';
      const limit = args?.limit || 5;

      let extracts = currentMapData.extracts
        .filter(e => e.position)
        .map(e => ({
          ...e,
          distance: calculateDistance(state.position, e.position)
        }))
        .sort((a, b) => a.distance - b.distance);

      if (faction !== 'all') {
        extracts = extracts.filter(e =>
          e.faction?.toLowerCase() === faction ||
          e.faction?.toLowerCase() === 'shared'
        );
      }

      extracts = extracts.slice(0, limit);

      const extractText = extracts.map((e, i) =>
        `${i + 1}. **${e.name}** (${e.faction || 'Shared'})\n` +
        `   Distance: ${e.distance.toFixed(0)} units\n` +
        `   Position: ${formatPosition(e.position)}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `**Nearby Extracts on ${currentMapData.name}**\n\n${extractText}`
        }]
      };
    }

    case 'get_nearby_bosses': {
      if (!state.position || !currentMapData?.bosses) {
        return {
          content: [{
            type: 'text',
            text: 'Cannot check bosses: No position data or map data available.'
          }]
        };
      }

      const radius = args?.radius || 200;
      const nearbyBosses = [];

      for (const boss of currentMapData.bosses) {
        for (const spawn of boss.spawnLocations || []) {
          if (!spawn.position) continue;
          const distance = calculateDistance(state.position, spawn.position);
          if (distance <= radius) {
            nearbyBosses.push({
              name: boss.name,
              location: spawn.name,
              chance: spawn.chance,
              distance,
              position: spawn.position
            });
          }
        }
      }

      if (nearbyBosses.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No boss spawn locations within ${radius} units of your position. You're relatively safe from bosses here!`
          }]
        };
      }

      const bossText = nearbyBosses
        .sort((a, b) => a.distance - b.distance)
        .map(b =>
          `**${b.name}** at ${b.location}\n` +
          `Distance: ${b.distance.toFixed(0)} units\n` +
          `Spawn Chance: ${(b.chance * 100).toFixed(0)}%`
        ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `**⚠️ WARNING: Boss Spawns Nearby!**\n\n${bossText}\n\nProceed with caution!`
        }]
      };
    }

    case 'get_nearby_loot': {
      if (!state.position || !currentMapData?.lootContainers) {
        return {
          content: [{
            type: 'text',
            text: 'Cannot find loot: No position data or map data available.'
          }]
        };
      }

      const radius = args?.radius || 50;
      const limit = args?.limit || 10;

      const nearbyLoot = currentMapData.lootContainers
        .filter(c => c.position)
        .map(c => ({
          ...c,
          distance: calculateDistance(state.position, c.position)
        }))
        .filter(c => c.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      if (nearbyLoot.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No loot containers within ${radius} units. Try increasing the search radius.`
          }]
        };
      }

      const lootText = nearbyLoot.map((c, i) =>
        `${i + 1}. ${c.name} (${c.distance.toFixed(0)} units away)`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `**Nearby Loot Containers (within ${radius} units)**\n\n${lootText}`
        }]
      };
    }

    case 'calculate_distance_to': {
      if (!state.position) {
        return {
          content: [{
            type: 'text',
            text: 'Cannot calculate distance: No current position available.'
          }]
        };
      }

      const target = {
        x: args.x,
        y: args.y || state.position.y,
        z: args.z
      };

      const distance = calculateDistance(state.position, target);

      return {
        content: [{
          type: 'text',
          text: `**Distance Calculation**\n\n` +
                `From: ${formatPosition(state.position)}\n` +
                `To: ${formatPosition(target)}\n` +
                `Distance: ${distance.toFixed(1)} units (~${(distance * 0.5).toFixed(0)} meters)`
        }]
      };
    }

    case 'analyze_movement': {
      const history = state.positionHistory;

      if (history.length < 2) {
        return {
          content: [{
            type: 'text',
            text: 'Not enough position data to analyze movement. Take more screenshots!'
          }]
        };
      }

      // Calculate stats
      let totalDistance = 0;
      let maxSpeed = 0;
      let heightChange = 0;

      for (let i = 1; i < history.length; i++) {
        const dist = calculateDistance(history[i - 1], history[i]);
        const timeDiff = (history[i].timestamp - history[i - 1].timestamp) / 1000;
        const speed = dist / timeDiff;

        totalDistance += dist;
        maxSpeed = Math.max(maxSpeed, speed);
        heightChange += Math.abs(history[i].y - history[i - 1].y);
      }

      const duration = (history[history.length - 1].timestamp - history[0].timestamp) / 1000;
      const avgSpeed = totalDistance / duration;

      return {
        content: [{
          type: 'text',
          text: `**Movement Analysis**\n\n` +
                `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s\n` +
                `Total Distance: ${totalDistance.toFixed(0)} units\n` +
                `Average Speed: ${avgSpeed.toFixed(1)} units/sec\n` +
                `Max Speed: ${maxSpeed.toFixed(1)} units/sec\n` +
                `Height Variation: ${heightChange.toFixed(1)} units\n` +
                `Positions Recorded: ${history.length}\n\n` +
                `Movement Pattern: ${avgSpeed > 5 ? 'Running/Sprinting' : avgSpeed > 2 ? 'Walking' : 'Slow/Cautious'}`
        }]
      };
    }

    case 'get_spawn_info': {
      if (!currentMapData?.spawns) {
        return {
          content: [{
            type: 'text',
            text: 'Spawn data not available for this map.'
          }]
        };
      }

      const side = args?.side || 'all';
      let spawns = currentMapData.spawns;

      if (side !== 'all') {
        spawns = spawns.filter(s =>
          s.sides?.some(spawnSide => spawnSide.toLowerCase().includes(side))
        );
      }

      const spawnZones = {};
      spawns.forEach(s => {
        const zone = s.zoneName || 'Unknown';
        if (!spawnZones[zone]) {
          spawnZones[zone] = { count: 0, sides: new Set() };
        }
        spawnZones[zone].count++;
        s.sides?.forEach(side => spawnZones[zone].sides.add(side));
      });

      const zoneText = Object.entries(spawnZones)
        .map(([zone, data]) =>
          `**${zone}**: ${data.count} spawns (${Array.from(data.sides).join(', ')})`
        ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `**Spawn Zones on ${currentMapData.name}**\n\nTotal Spawns: ${spawns.length}\n\n${zoneText}`
        }]
      };
    }

    case 'suggest_extract_route': {
      if (!state.position || !currentMapData?.extracts) {
        return {
          content: [{
            type: 'text',
            text: 'Cannot suggest route: No position or extract data available.'
          }]
        };
      }

      const playerType = args?.playerType || 'pmc';
      const avoidBosses = args?.avoidBosses !== false;

      // Filter extracts by player type
      let validExtracts = currentMapData.extracts
        .filter(e => e.position)
        .filter(e => {
          const faction = e.faction?.toLowerCase();
          return faction === playerType || faction === 'shared' || !faction;
        })
        .map(e => ({
          ...e,
          distance: calculateDistance(state.position, e.position)
        }));

      // Check for boss proximity if avoiding bosses
      if (avoidBosses && currentMapData.bosses) {
        validExtracts = validExtracts.map(extract => {
          let bossRisk = 0;
          for (const boss of currentMapData.bosses) {
            for (const spawn of boss.spawnLocations || []) {
              if (!spawn.position) continue;
              const distToBoss = calculateDistance(extract.position, spawn.position);
              if (distToBoss < 100) {
                bossRisk += spawn.chance || 0.5;
              }
            }
          }
          return { ...extract, bossRisk };
        });
      }

      // Sort by distance and boss risk
      validExtracts.sort((a, b) => {
        const riskA = a.bossRisk || 0;
        const riskB = b.bossRisk || 0;
        // Prefer lower risk, then shorter distance
        if (Math.abs(riskA - riskB) > 0.2) {
          return riskA - riskB;
        }
        return a.distance - b.distance;
      });

      const recommended = validExtracts[0];

      if (!recommended) {
        return {
          content: [{
            type: 'text',
            text: `No valid extracts found for ${playerType} on this map.`
          }]
        };
      }

      const alternatives = validExtracts.slice(1, 3);

      let response = `**Recommended Extract Route**\n\n` +
                    `🎯 **${recommended.name}**\n` +
                    `Distance: ${recommended.distance.toFixed(0)} units\n` +
                    `Position: ${formatPosition(recommended.position)}\n`;

      if (recommended.bossRisk) {
        response += `Boss Risk: ${(recommended.bossRisk * 100).toFixed(0)}%\n`;
      }

      if (alternatives.length > 0) {
        response += `\n**Alternatives:**\n`;
        alternatives.forEach((alt, i) => {
          response += `${i + 2}. ${alt.name} (${alt.distance.toFixed(0)} units)`;
          if (alt.bossRisk) {
            response += ` - Risk: ${(alt.bossRisk * 100).toFixed(0)}%`;
          }
          response += '\n';
        });
      }

      return {
        content: [{
          type: 'text',
          text: response
        }]
      };
    }

    default:
      return {
        content: [{
          type: 'text',
          text: `Unknown tool: ${name}`
        }],
        isError: true
      };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'tarkov://position',
        name: 'Current Position',
        description: 'Current player position in Tarkov',
        mimeType: 'application/json'
      },
      {
        uri: 'tarkov://map',
        name: 'Current Map',
        description: 'Current map information',
        mimeType: 'application/json'
      },
      {
        uri: 'tarkov://history',
        name: 'Position History',
        description: 'Trail of player positions',
        mimeType: 'application/json'
      }
    ]
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const state = readState();

  switch (uri) {
    case 'tarkov://position':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(state.position, null, 2)
        }]
      };

    case 'tarkov://map':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ currentMap: state.currentMap }, null, 2)
        }]
      };

    case 'tarkov://history':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(state.positionHistory, null, 2)
        }]
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tarkov Tracker MCP Server running on stdio');
}

main().catch(console.error);
