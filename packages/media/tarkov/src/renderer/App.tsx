import React, { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import MapSelector from './components/MapSelector';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import StatusBar from './components/StatusBar';
import { useStore } from './store';

declare global {
  interface Window {
    require: any;
  }
}

const App: React.FC = () => {
  const { setPosition, setStatus } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // Only use IPC in Electron environment
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');

      ipcRenderer.on('position', (_: any, position: any) => {
        setPosition(position);
      });

      ipcRenderer.on('status', (_: any, status: any) => {
        setStatus(status);
      });

      return () => {
        ipcRenderer.removeAllListeners('position');
        ipcRenderer.removeAllListeners('status');
      };
    }
  }, [setPosition, setStatus]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0c] via-[#111114] to-[#0d0d10] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map Selector */}
        <MapSelector />

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapView />

          {/* Filter Toggle Button */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="absolute top-3 right-3 z-[1000] glass px-3 py-2 rounded-lg text-sm font-medium text-[#c7a44a] hover:bg-white/5 transition-smooth no-drag flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          {/* Filter Panel Overlay */}
          <FilterPanel isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />
        </div>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
};

export default App;
