/* H&M adapter. www2.hm.com is a client-rendered SPA that embeds product data in
   a state blob (like Uniqlo) and ships OpenGraph tags. We read og:title, the
   price (meta or blob), and composition from the blob's materials/composition
   field, falling back to any hydrated "Composition / Materials" panel. Calibrate
   selectors against a live PDP. */

import type { Product } from '../../engine/types';
import { extractGeneric, findProductRoot } from './generic';

function textOf(doc: Document, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    const t = el?.textContent?.replace(/\s+/g, ' ').trim();
    if (t) return t;
  }
  return null;
}

export function extractHM(doc: Document, url: string): Product | null {
  const html = doc.documentElement?.outerHTML ?? '';

  const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const title = (og || textOf(doc, ['h1']) || '').replace(/\s*[|·]\s*H&?M.*$/i, '').trim() || null;

  const priceText =
    doc.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')?.getAttribute('content') ||
    html.match(/"(?:price|whitePrice|redPrice)"\s*:\s*\{[^{}]*?"value"\s*:\s*([0-9]+(?:\.[0-9]+)?)/)?.[1] ||
    textOf(doc, ['[class*="price"] [class*="value"]', 'span[class*="price"]', '[data-testid*="price"]']);

  // Composition: H&M uses hashed CSS classes that change per deploy, so class
  // selectors are useless, and a broad section/dl scan pulls fabric from
  // recommendation cards ("you may also like"). Instead anchor on the visible
  // "Composition" label — recommendation cards show "Save to favourites", never a
  // Composition label — and scope the search to the main product region. Handles
  // both single fibers ("Polyester 100%") and blends ("Cotton 60%, Polyester 40%").
  const blobM = html.match(/"composition"\s*:\s*"([^"]+)"/i);
  const rootText = (findProductRoot(doc).textContent || '').replace(/\s+/g, ' ');
  const labelM = rootText.match(
    /Composition\s*([A-Za-z][A-Za-z\s]{0,20}?\d{1,3}\s*%(?:\s*[,/]?\s*[A-Za-z][A-Za-z\s]{0,20}?\d{1,3}\s*%)*)/i,
  );
  const specText = blobM?.[1] || labelM?.[1] || undefined;

  return extractGeneric(doc, url, { title, priceText, specText });
}
