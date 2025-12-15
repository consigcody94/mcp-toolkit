import { create } from 'zustand';

export interface Position {
  x: number;
  y: number;
  z: number;
  rotation: number;
  timestamp: number;
}

export interface Status {
  watching: boolean;
  path?: string;
  error?: string;
}

export interface Filters {
  extracts: boolean;
  spawns: boolean;
  quests: boolean;
  loot: boolean;
  bosses: boolean;
  keys: boolean;
  caches: boolean;
}

interface Store {
  currentMap: string;
  position: Position | null;
  positionHistory: Position[];
  status: Status;
  filters: Filters;
  alwaysOnTop: boolean;
  opacity: number;
  autoScreenshot: boolean;
  autoScreenshotInterval: number;

  setCurrentMap: (map: string) => void;
  setPosition: (position: Position) => void;
  clearHistory: () => void;
  setStatus: (status: Status) => void;
  setFilter: (key: keyof Filters, value: boolean) => void;
  setAlwaysOnTop: (value: boolean) => void;
  setOpacity: (value: number) => void;
  setAutoScreenshot: (enabled: boolean) => void;
  setAutoScreenshotInterval: (interval: number) => void;
}

export const useStore = create<Store>((set, get) => ({
  currentMap: 'customs',
  position: null,
  positionHistory: [],
  status: { watching: false },
  filters: {
    extracts: true,
    spawns: true,
    quests: true,
    loot: false,
    bosses: true,
    keys: false,
    caches: false,
  },
  alwaysOnTop: true,
  opacity: 1,
  autoScreenshot: false,
  autoScreenshotInterval: 2500,

  setCurrentMap: (map) => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('change-map', map);
    }
    set({ currentMap: map, position: null, positionHistory: [] });
  },

  setPosition: (position) =>
    set((state) => ({
      position,
      positionHistory: [...state.positionHistory.slice(-19), position],
    })),

  clearHistory: () => set({ positionHistory: [], position: null }),

  setStatus: (status) => set({ status }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setAlwaysOnTop: (value) => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('toggle-always-on-top', value);
    }
    set({ alwaysOnTop: value });
  },

  setOpacity: (value) => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('set-opacity', value);
    }
    set({ opacity: value });
  },

  setAutoScreenshot: (enabled) => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      const interval = get().autoScreenshotInterval;
      ipcRenderer.send('toggle-auto-screenshot', { enabled, interval });
    }
    set({ autoScreenshot: enabled });
  },

  setAutoScreenshotInterval: (interval) => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      const enabled = get().autoScreenshot;
      if (enabled) {
        ipcRenderer.send('toggle-auto-screenshot', { enabled, interval });
      }
    }
    set({ autoScreenshotInterval: interval });
  },
}));
