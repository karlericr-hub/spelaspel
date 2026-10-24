import { defineConfig } from 'vite'

// Bygget hamnar i ../kattdropp och serveras som en undersida till SpelaSpel
export default defineConfig({
  base: './',
  build: {
    outDir: '../kattdropp',
    emptyOutDir: true,
  },
})
