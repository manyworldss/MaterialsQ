import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

// MaterialIQ MV3 manifest.
// Host permissions are scoped to the beta retailers only — we do not read arbitrary sites.
// Add a retailer: append its origin here AND register an adapter in src/extraction/retailers.
export const RETAILER_ORIGINS = [
  '*://*/*'
];

export default defineManifest({
  manifest_version: 3,
  name: 'MaterialIQ: is it worth the price?',
  version: pkg.version,
  description: pkg.description,
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'MaterialIQ',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'activeTab', 'scripting', 'sidePanel'],
  host_permissions: RETAILER_ORIGINS,
  content_scripts: [
    {
      matches: RETAILER_ORIGINS,
      js: ['src/content/main.tsx'],
      run_at: 'document_idle',
    },
  ],
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
});
