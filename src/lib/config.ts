/* Build-time config. The backend URL is injected via Vite env
   (VITE_MIQ_BACKEND_URL) so dev and prod can differ. Defaults to localhost. */

export const BACKEND_URL = import.meta.env.VITE_MIQ_BACKEND_URL || 'http://localhost:8787';
