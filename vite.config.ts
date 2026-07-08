import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  // CRXJS needs a stable HMR port for the content-script client.
  server: { port: 5178, strictPort: true, hmr: { port: 5178 } },
  build: { target: 'es2022', sourcemap: true },
});
