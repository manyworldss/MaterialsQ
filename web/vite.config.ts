import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Reuse the extension's design system and engine directly — one source of truth.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ds': resolve(here, '../src/design-system'),
      '@engine': resolve(here, '../src/engine'),
      '@extraction': resolve(here, '../src/extraction'),
    },
  },
  server: {
    port: 5180,
    host: true,
    fs: { allow: [resolve(here, '..')] }, // permit importing from ../src
  },
});
