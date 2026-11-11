import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    manifest: true, // used to precache only the eager application shell, not Leaflet
  },
});
