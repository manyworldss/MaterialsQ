/* H&M adapter. www2.hm.com is a client-rendered SPA that embeds product data in
   a state blob (like Uniqlo) and ships OpenGraph tags. We read og:title, the
   price (meta or blob), and composition from the blob's materials/composition
   field, falling back to any hydrated "Composition / Materials" panel. Calibrate
   selectors against a live PDP. */

import type { Product } from '../../engine/types';
import { extractGeneric } from './generic';

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

  // Composition: blob field, then hydrated materials panels. The generic
  // extractor also scans scripts as a last resort.
  const compM = html.match(/"composition"\s*:\s*"([^"]+)"/i) || html.match(/Composition[^%<]{0,30}(\d{1,3}\s*%[^<"]{0,60})/i);
  const panels = Array.from(doc.querySelectorAll('[class*="composition"], [class*="materials"], [class*="ProductDetails"], [class*="detail"], section, dl'))
    .map((n) => n.textContent?.replace(/\s+/g, ' ').trim() || '')
    .filter((t) => /(cotton|polyester|wool|elastane|viscose|composition|%)/i.test(t))
    .join(' · ');
  const specText = [compM ? compM[1] : '', panels].filter(Boolean).join(' · ') || undefined;

  return extractGeneric(doc, url, { title, priceText, specText });
}
