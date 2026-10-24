import { defineConfig } from 'vite';

// Bygget hamnar i ../butiken och serveras som en undersida till SpelaSpel
export default defineConfig({
  base: './',
  build: {
    outDir: '../butiken',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
