import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages (/MLN131/) and any static host.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
});
