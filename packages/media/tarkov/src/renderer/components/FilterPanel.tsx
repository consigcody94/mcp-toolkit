import React from 'react';
import { useStore, Filters } from '../store';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTER_OPTIONS: { key: keyof Filters; label: string; icon: string; color: string }[] = [
  { key: 'extracts', label: 'Extracts', icon: '🚪', color: '#22c55e' },
  { key: 'spawns', label: 'Spawns', icon: '🎯', color: '#3b82f6' },
  { key: 'bosses', label: 'Bosses', icon: '💀', color: '#ef4444' },
  { key: 'quests', label: 'Quest Items', icon: '📋', color: '#f97316' },
  { key: 'loot', label: 'Loot Containers', icon: '📦', color: '#a855f7' },
  { key: 'keys', label: 'Locked Doors', icon: '🔑', color: '#06b6d4' },
  { key: 'caches', label: 'Stashes', icon: '💰', color: '#eab308' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose }) => {
  const { filters, setFilter, clearHistory } = useStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 z-[999]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute top-3 right-14 z-[1000] w-64 glass-dark rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-right-2 duration-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white/90">Map Filters</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Filter List */}
        <div className="p-2">
          {FILTER_OPTIONS.map((option) => (
            <label
              key={option.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters[option.key]}
                  onChange={(e) => setFilter(option.key, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                    filters[option.key]
                      ? 'border-[#c7a44a] bg-[#c7a44a]/20'
                      : 'border-white/20 group-hover:border-white/30'
                  }`}
                >
                  {filters[option.key] && (
                    <svg className="w-3 h-3 text-[#c7a44a]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
              </div>

              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />

              <span className="text-sm" style={{ marginRight: 'auto' }}>
                {option.icon}
              </span>

              <span className={`text-sm ${filters[option.key] ? 'text-white/90' : 'text-white/50'}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="px-3 py-3 border-t border-white/5">
          <button
            onClick={clearHistory}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Position History
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
