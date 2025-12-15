import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useStore } from '../store';

// Map configuration with bounds and image URLs from tarkov.dev
const MAP_CONFIG: Record<string, {
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  minZoom: number;
  maxZoom: number;
  gameToMap: (x: number, z: number) => [number, number];
}> = {
  customs: {
    imageUrl: 'https://tarkov.dev/maps/customs-2d.jpg',
    bounds: [[-1000, -1000], [1000, 1000]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.5, x * 1.5],
  },
  woods: {
    imageUrl: 'https://tarkov.dev/maps/woods-2d.jpg',
    bounds: [[-1200, -1200], [1200, 1200]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.2, x * 1.2],
  },
  shoreline: {
    imageUrl: 'https://tarkov.dev/maps/shoreline-2d.jpg',
    bounds: [[-1500, -1500], [1500, 1500]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.3, x * 1.3],
  },
  interchange: {
    imageUrl: 'https://tarkov.dev/maps/interchange-2d.jpg',
    bounds: [[-1000, -1000], [1000, 1000]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.4, x * 1.4],
  },
  reserve: {
    imageUrl: 'https://tarkov.dev/maps/reserve-2d.jpg',
    bounds: [[-800, -800], [800, 800]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.5, x * 1.5],
  },
  lighthouse: {
    imageUrl: 'https://tarkov.dev/maps/lighthouse-2d.jpg',
    bounds: [[-1200, -1200], [1200, 1200]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.3, x * 1.3],
  },
  streets: {
    imageUrl: 'https://tarkov.dev/maps/streets-2d.jpg',
    bounds: [[-1500, -1500], [1500, 1500]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 1.2, x * 1.2],
  },
  'ground-zero': {
    imageUrl: 'https://tarkov.dev/maps/ground-zero-2d.jpg',
    bounds: [[-600, -600], [600, 600]],
    center: [0, 0],
    minZoom: -2,
    maxZoom: 2,
    gameToMap: (x, z) => [z * 2, x * 2],
  },
  labs: {
    imageUrl: 'https://tarkov.dev/maps/labs-2d.jpg',
    bounds: [[-500, -500], [500, 500]],
    center: [0, 0],
    minZoom: -1,
    maxZoom: 3,
    gameToMap: (x, z) => [z * 2.5, x * 2.5],
  },
  factory: {
    imageUrl: 'https://tarkov.dev/maps/factory-2d.jpg',
    bounds: [[-300, -300], [300, 300]],
    center: [0, 0],
    minZoom: 0,
    maxZoom: 3,
    gameToMap: (x, z) => [z * 3, x * 3],
  },
};

const MapView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const playerMarker = useRef<L.Marker | null>(null);
  const historyLayer = useRef<L.LayerGroup | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { currentMap, position, positionHistory, filters } = useStore();

  // Fetch map data from tarkov.dev API
  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
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
                spawns { position { x y z } sides categories zoneName }
                extracts { name position { x y z } faction }
                bosses { name spawnLocations { name position { x y z } chance } }
                lootContainers { position { x y z } name }
              }
            }`,
          }),
        });
        const data = await response.json();
        const maps: Record<string, any> = {};
        data.data.maps.forEach((m: any) => {
          maps[m.normalizedName] = m;
        });
        setMapData(maps);
      } catch (err) {
        console.error('Failed to fetch map data:', err);
      }
      setLoading(false);
    };
    fetchMapData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const config = MAP_CONFIG[currentMap] || MAP_CONFIG.customs;

    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      zoomControl: true,
      attributionControl: false,
    });

    map.setView(config.center, 0);
    leafletMap.current = map;
    historyLayer.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update map when currentMap changes
  useEffect(() => {
    if (!leafletMap.current) return;

    const map = leafletMap.current;
    const config = MAP_CONFIG[currentMap] || MAP_CONFIG.customs;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.ImageOverlay || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Reset history layer
    if (historyLayer.current) {
      historyLayer.current.clearLayers();
    }

    // Add new map image
    L.imageOverlay(config.imageUrl, config.bounds).addTo(map);
    map.setView(config.center, 0);
    map.setMinZoom(config.minZoom);
    map.setMaxZoom(config.maxZoom);

    // Add markers from API data
    if (mapData && mapData[currentMap]) {
      const data = mapData[currentMap];

      // Extracts
      if (filters.extracts && data.extracts) {
        data.extracts.forEach((extract: any) => {
          if (!extract.position) return;
          const [lat, lng] = config.gameToMap(extract.position.x, extract.position.z);
          const color = extract.faction === 'pmc' ? '#22c55e' : extract.faction === 'scav' ? '#f97316' : '#0ea5e9';
          L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8,
          })
            .bindPopup(`<div class="font-semibold">${extract.name}</div><div class="text-xs opacity-70">${extract.faction || 'Shared'} Extract</div>`)
            .addTo(map);
        });
      }

      // Spawns
      if (filters.spawns && data.spawns) {
        data.spawns.slice(0, 30).forEach((spawn: any) => {
          if (!spawn.position) return;
          const [lat, lng] = config.gameToMap(spawn.position.x, spawn.position.z);
          L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 1,
            fillOpacity: 0.6,
          })
            .bindPopup(`<div class="font-semibold">Spawn Point</div><div class="text-xs opacity-70">${spawn.sides?.join(', ') || 'Unknown'}</div>`)
            .addTo(map);
        });
      }

      // Bosses
      if (filters.bosses && data.bosses) {
        data.bosses.forEach((boss: any) => {
          boss.spawnLocations?.forEach((loc: any) => {
            if (!loc.position) return;
            const [lat, lng] = config.gameToMap(loc.position.x, loc.position.z);
            L.circleMarker([lat, lng], {
              radius: 10,
              fillColor: '#ef4444',
              color: '#fbbf24',
              weight: 3,
              fillOpacity: 0.8,
            })
              .bindPopup(`<div class="font-bold text-red-400">${boss.name}</div><div class="text-xs opacity-70">${loc.name} (${Math.round(loc.chance * 100)}%)</div>`)
              .addTo(map);
          });
        });
      }

      // Loot containers
      if (filters.loot && data.lootContainers) {
        data.lootContainers.slice(0, 50).forEach((container: any) => {
          if (!container.position) return;
          const [lat, lng] = config.gameToMap(container.position.x, container.position.z);
          L.circleMarker([lat, lng], {
            radius: 4,
            fillColor: '#a855f7',
            color: '#fff',
            weight: 1,
            fillOpacity: 0.5,
          })
            .bindPopup(`<div class="font-semibold">${container.name}</div>`)
            .addTo(map);
        });
      }
    }
  }, [currentMap, mapData, filters]);

  // Update player position
  useEffect(() => {
    if (!leafletMap.current || !position) return;

    const config = MAP_CONFIG[currentMap] || MAP_CONFIG.customs;
    const [lat, lng] = config.gameToMap(position.x, position.z);

    // Create player icon
    const playerIcon = L.divIcon({
      className: 'player-marker',
      html: `
        <div style="position: relative; width: 30px; height: 30px;">
          <div style="
            position: absolute;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, rgba(199,164,74,0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(${position.rotation}deg);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 16px solid #c7a44a;
            filter: drop-shadow(0 0 4px rgba(199,164,74,0.8));
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: #ffd866;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(255,216,102,0.8);
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    if (playerMarker.current) {
      playerMarker.current.setLatLng([lat, lng]);
      playerMarker.current.setIcon(playerIcon);
    } else {
      playerMarker.current = L.marker([lat, lng], { icon: playerIcon }).addTo(leafletMap.current);
    }

    // Add to history trail
    if (historyLayer.current) {
      L.circleMarker([lat, lng], {
        radius: 3,
        fillColor: '#c7a44a',
        color: 'transparent',
        fillOpacity: 0.4,
      }).addTo(historyLayer.current);
    }

    // Pan to player
    leafletMap.current.panTo([lat, lng], { animate: true, duration: 0.5 });
  }, [position, currentMap]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#c7a44a] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading map data...</span>
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      {position && (
        <div className="absolute bottom-3 left-3 z-[1000] glass px-3 py-2 rounded-lg">
          <div className="text-xs text-white/40 mb-1">Current Position</div>
          <div className="text-sm font-mono text-[#c7a44a]">
            X: {position.x.toFixed(1)} | Y: {position.y.toFixed(1)} | Z: {position.z.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
