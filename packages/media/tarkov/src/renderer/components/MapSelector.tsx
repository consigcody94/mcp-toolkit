import React from 'react';
import { useStore } from '../store';

const MAPS = [
  { id: 'customs', name: 'Customs', icon: '🏭' },
  { id: 'woods', name: 'Woods', icon: '🌲' },
  { id: 'shoreline', name: 'Shoreline', icon: '🏖️' },
  { id: 'interchange', name: 'Interchange', icon: '🏬' },
  { id: 'reserve', name: 'Reserve', icon: '🏰' },
  { id: 'lighthouse', name: 'Lighthouse', icon: '🏠' },
  { id: 'streets', name: 'Streets', icon: '🌆' },
  { id: 'ground-zero', name: 'Ground Zero', icon: '☢️' },
  { id: 'labs', name: 'Labs', icon: '🔬' },
  { id: 'factory', name: 'Factory', icon: '⚙️' },
];

const MapSelector: React.FC = () => {
  const { currentMap, setCurrentMap, clearHistory } = useStore();

  const handleMapChange = (mapId: string) => {
    setCurrentMap(mapId);
    clearHistory();
  };

  return (
    <div className="px-3 py-2 border-b border-white/5 bg-black/20">
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        {MAPS.map((map) => (
          <button
            key={map.id}
            onClick={() => handleMapChange(map.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${currentMap === map.id
                ? 'bg-gradient-to-r from-[#c7a44a]/20 to-[#9a8866]/20 text-[#c7a44a] border border-[#c7a44a]/30 shadow-lg shadow-[#c7a44a]/10'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            <span className="text-sm">{map.icon}</span>
            <span>{map.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapSelector;
