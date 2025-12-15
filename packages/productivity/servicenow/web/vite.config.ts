import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/servicenow-dashboard-generator/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
