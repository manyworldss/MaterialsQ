/* Build-time config. The backend URL is injected via Vite env
   (VITE_MIQ_BACKEND_URL) so dev and prod can differ. Defaults to localhost. */

export const BACKEND_URL = import.meta.env.VITE_MIQ_BACKEND_URL || 'http://localhost:8787';

/* Every outbound merchant link goes through the backend's /api/go redirect,
   which wraps it in the Skimlinks affiliate URL server-side (so it survives
   ad-blockers and the publisher ID never ships in the extension bundle). */
export function affiliateUrl(target: string): string {
  return `${BACKEND_URL}/api/go?target=${encodeURIComponent(target)}`;
}
