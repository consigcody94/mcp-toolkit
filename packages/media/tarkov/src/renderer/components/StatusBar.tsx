import React from 'react';
import { useStore } from '../store';

const StatusBar: React.FC = () => {
  const { status, position, positionHistory, currentMap, autoScreenshot, autoScreenshotInterval } = useStore();

  const mapNames: Record<string, string> = {
    customs: 'Customs',
    woods: 'Woods',
    shoreline: 'Shoreline',
    interchange: 'Interchange',
    reserve: 'Reserve',
    lighthouse: 'Lighthouse',
    streets: 'Streets of Tarkov',
    'ground-zero': 'Ground Zero',
    labs: 'The Lab',
    factory: 'Factory',
  };

  return (
    <div className="h-8 px-4 flex items-center justify-between bg-black/30 border-t border-white/5 text-xs">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              autoScreenshot
                ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                : status.watching
                ? 'bg-green-500 shadow-lg shadow-green-500/50 status-blink'
                : status.error
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
          />
          <span className="text-white/50">
            {autoScreenshot
              ? `Auto-tracking (${autoScreenshotInterval / 1000}s)`
              : status.watching
              ? 'Watching screenshots'
              : status.error
              ? status.error
              : 'Initializing...'}
          </span>
        </div>

        {/* Map Name */}
        <div className="text-white/30">|</div>
        <div className="text-[#c7a44a]/80 font-medium">
          {mapNames[currentMap] || currentMap}
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 text-white/40">
        {/* Last Update */}
        {position && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {new Date(position.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Position Count */}
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>{positionHistory.length} points</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
