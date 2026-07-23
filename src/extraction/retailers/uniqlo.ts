/* Uniqlo adapter. Uniqlo ships NO schema.org JSON-LD; instead the product data
   is embedded as a JSON state blob in the page (present both pre- and
   post-hydration), e.g.:
     "name":"Crew Neck T-Shirt","prices":{"base":{"currency":{"code":"USD"...},"value":24.9}
     "composition":"100% Cotton<br><br>Imported"
   Reading that blob is more reliable than DOM selectors, which only exist after
   React hydrates. Verified against a live US PDP (E422992-000). GSM isn't
   published for tees, so it stays null and the engine redistributes its weight. */

import type { Product } from '../../engine/types';
import { extractGeneric } from './generic';

/** Turn "100% Cotton<br><br>Imported" into "100% Cotton". */
function cleanComposition(raw: string): string {
  return raw
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .split(/<|\\n/)[0]
    .trim();
}

export function extractUniqlo(doc: Document, url: string): Product | null {
  const html = doc.documentElement?.outerHTML ?? '';

  // Title: clean og:title, dropping the " | UNIQLO US" suffix. Fall back to the
  // product object's "name" in the blob, then any h1.
  const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const nameInBlob = html.match(/"name"\s*:\s*"([^"]+?)"\s*,\s*"prices?"/);
  const title =
    (og || nameInBlob?.[1] || doc.querySelector('h1')?.textContent || '').replace(/\s*\|\s*UNIQLO.*$/i, '').trim() || null;

  // Price: try the legacy state blob first (older markets still ship it), then the
  // current DOM. Uniqlo's rebuilt storefront (fr-ec-* classes) no longer embeds a
  // prices blob — the main PDP price renders in .fr-ec-price-text--large, while the
  // --middle variants are recommendation cards. Target the large one so we never
  // grab a related item's price.
  const priceM = html.match(/"prices"\s*:\s*\{\s*"base"\s*:\s*\{[\s\S]{0,200}?"value"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  const priceEl =
    doc.querySelector('.fr-ec-price-text--large') ||
    doc.querySelector('main .fr-ec-price-text, [role="main"] .fr-ec-price-text') ||
    doc.querySelector('.fr-ec-price-text, [class*="price-text" i], span[class*="price" i], [data-testid*="price" i]');
  const priceText = priceM?.[1] || priceEl?.textContent || null;

  // Composition: embedded field, else any hydrated panel that mentions fibers.
  const compM = html.match(/"composition"\s*:\s*"([^"]+)"/);
  const panels = Array.from(doc.querySelectorAll('[class*="accordion"], [class*="detail"], section, dl'))
    .map((n) => n.textContent?.replace(/\s+/g, ' ').trim() || '')
    .filter((t) => /(cotton|polyester|wool|material|composition|%)/i.test(t))
    .join(' · ');
  // The blob's composition is authoritative; only fall back to panel text (which
  // is noisy) when the blob didn't carry it.
  const specText = compM ? cleanComposition(compM[1]) : panels;

  return extractGeneric(doc, url, { title, priceText, specText });
}
