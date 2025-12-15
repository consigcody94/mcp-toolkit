import React from 'react';
import { useStore } from '../store';

declare global {
  interface Window {
    require: any;
  }
}

const TitleBar: React.FC = () => {
  const {
    alwaysOnTop, setAlwaysOnTop,
    opacity, setOpacity,
    autoScreenshot, setAutoScreenshot,
    autoScreenshotInterval, setAutoScreenshotInterval
  } = useStore();

  const handleMinimize = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('minimize');
    }
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('close');
    }
  };

  return (
    <div className="drag-region h-10 flex items-center justify-between px-4 bg-gradient-to-r from-[#0a0a0c] via-[#111114] to-[#0a0a0c] border-b border-white/5">
      {/* Logo & Title */}
      <div className="flex items-center gap-3 no-drag">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c7a44a] to-[#9a8866] flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-white/90 tracking-wide">TARKOV TRACKER</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Auto Screenshot Toggle */}
        <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded-lg bg-white/5">
          <button
            onClick={() => setAutoScreenshot(!autoScreenshot)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
              autoScreenshot
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-white/50 hover:text-white/70 border border-transparent'
            }`}
            title={autoScreenshot ? 'Stop Auto-Tracking' : 'Start Auto-Tracking'}
          >
            {autoScreenshot ? (
              <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span>{autoScreenshot ? 'LIVE' : 'Auto'}</span>
          </button>

          {/* Interval selector */}
          <select
            value={autoScreenshotInterval}
            onChange={(e) => setAutoScreenshotInterval(parseInt(e.target.value))}
            className="bg-transparent text-xs text-white/50 border-none outline-none cursor-pointer"
            title="Screenshot interval"
          >
            <option value="1000" className="bg-[#111]">1s</option>
            <option value="1500" className="bg-[#111]">1.5s</option>
            <option value="2000" className="bg-[#111]">2s</option>
            <option value="2500" className="bg-[#111]">2.5s</option>
            <option value="3000" className="bg-[#111]">3s</option>
            <option value="5000" className="bg-[#111]">5s</option>
          </select>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-2 mr-2">
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#c7a44a] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Always on Top Toggle */}
        <button
          onClick={() => setAlwaysOnTop(!alwaysOnTop)}
          className={`p-1.5 rounded transition-all ${
            alwaysOnTop
              ? 'text-[#c7a44a] bg-[#c7a44a]/10'
              : 'text-white/40 hover:text-white/60'
          }`}
          title="Always on Top"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
        </button>

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
