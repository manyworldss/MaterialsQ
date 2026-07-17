import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  // CRXJS needs a stable HMR port for the content-script client.
  server: { port: 5178, strictPort: true, hmr: { port: 5178 } },
  // No sourcemaps in the packaged build: keeps the store zip small and avoids
  // shipping full source maps as web_accessible_resources on every page.
  build: { target: 'es2022', sourcemap: false },
});
