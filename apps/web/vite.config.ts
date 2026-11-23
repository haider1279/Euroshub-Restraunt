import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Long-lived vendor chunks so app deploys don't bust the framework cache.
// Recharts (and its d3/lodash deps) only loads with the admin dashboard route.
const VENDOR_CHUNKS: Array<[chunk: string, test: RegExp]> = [
  ['charts', /[\\/]node_modules[\\/](recharts|recharts-scale|victory-vendor|d3-[^\\/]+|internmap|lodash|react-smooth|decimal\.js-light|eventemitter3|fast-equals|tiny-invariant|react-is)[\\/]/],
  ['react', /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/],
  ['router-query', /[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run|@tanstack)[\\/]/],
  ['forms', /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/],
  // Shared with recharts; without an explicit home Rollup pulls them into
  // `charts`, which would then be preloaded on every page.
  ['react', /[\\/]node_modules[\\/](clsx|tailwind-merge)[\\/]/],
];

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          for (const [chunk, test] of VENDOR_CHUNKS) {
            if (test.test(id)) return chunk;
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
