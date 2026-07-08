/* Extraction entry point. Picks a retailer adapter by hostname and falls back
   to the generic schema.org extractor. Add a retailer: register it here and add
   its origin to RETAILER_ORIGINS in src/manifest.ts. */

import type { Product } from '../engine/types';
import { extractGeneric } from './retailers/generic';
import { extractUniqlo } from './retailers/uniqlo';

type Adapter = (doc: Document, url: string) => Product | null;

const ADAPTERS: { test: RegExp; extract: Adapter }[] = [
  { test: /(^|\.)uniqlo\.com$/i, extract: extractUniqlo },
  // H&M and Amazon ship usable JSON-LD/OG tags, so the generic adapter carries
  // them until they need bespoke selectors.
  { test: /(^|\.)hm\.com$/i, extract: extractGeneric },
  { test: /(^|\.)amazon\.com$/i, extract: extractGeneric },
];

export function extractProduct(doc: Document = document, url: string = location.href): Product | null {
  const host = new URL(url).hostname;
  const adapter = ADAPTERS.find((a) => a.test.test(host));
  try {
    return (adapter?.extract ?? extractGeneric)(doc, url);
  } catch (err) {
    console.warn('[MaterialIQ] extraction failed:', err);
    return null;
  }
}

export { extractGeneric } from './retailers/generic';
