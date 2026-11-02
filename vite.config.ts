/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5340 },
  // the 3D view (three.js) is its own lazy chunk, loaded only when opened
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] },
});
