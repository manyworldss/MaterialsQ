/* Amazon adapter. Amazon rarely ships schema.org JSON-LD on apparel PDPs, so we
   read its stable DOM: #productTitle, the buy-box price (.a-price .a-offscreen),
   and the "Product details / information" tables + detail bullets for fabric
   composition ("Fabric type", "Material composition"). Selectors are Amazon's
   long-standing IDs; calibrate against a live PDP before relying on it. */

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

export function extractAmazon(doc: Document, url: string): Product | null {
  const title = textOf(doc, ['#productTitle', 'h1#title', 'h1.product-title-word-break', 'h1']);

  // Buy-box price. `.a-offscreen` holds the full "$24.99" string.
  const priceText = textOf(doc, [
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#corePrice_feature_div .a-price .a-offscreen',
    '#apex_desktop .a-price .a-offscreen',
    '.priceToPay .a-offscreen',
    '#tp_price_block_total_price_ww .a-offscreen',
    'span[data-a-color="price"] .a-offscreen',
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#price_inside_buybox',
  ]);

  // Fabric/composition: the "Product overview" attribute table is the usual home
  // on apparel PDPs; fall back to detail bullets / tech-spec tables.
  let specText = Array.from(
    doc.querySelectorAll(
      '#productOverview_feature_div tr, #productFactsDesktopExpander li, #detailBullets_feature_div li, #productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, #feature-bullets li, #productDescription, .prodDetSectionEntry, .a-expander-content li',
    ),
  )
    .map((n) => n.textContent?.replace(/\s+/g, ' ').trim() || '')
    .filter((t) => t.length > 3 && t.length < 240 && /(material|fabric|cotton|polyester|wool|linen|viscose|nylon|acrylic|composition|gsm|%)/i.test(t))
    .join(' · ')
    .slice(0, 4000);

  const FIBERS = 'cotton|polyester|wool|elastane|spandex|viscose|rayon|linen|nylon|acrylic|modal|cashmere|silk';
  // Last resort for server-rendered Amazon: scan the whole page text for a
  // composition fragment ("100% Cotton" or "Cotton 100%"), in either order.
  if (!new RegExp(FIBERS, 'i').test(specText)) {
    const body = (doc.body?.textContent || '').replace(/\s+/g, ' ');
    const m =
      body.match(new RegExp(`(\\d{1,3}\\s*%\\s*(?:${FIBERS})(?:\\s*[,/]?\\s*\\d{1,3}\\s*%\\s*[a-z]+)*)`, 'i')) ||
      body.match(new RegExp(`((?:${FIBERS})\\s*\\d{1,3}\\s*%(?:\\s*[,/]?\\s*[a-z]+\\s*\\d{1,3}\\s*%)*)`, 'i'));
    if (m) specText = [specText, m[1]].filter(Boolean).join(' · ');
  }

  // Price fallback: first "$NN.NN" in the page if the buy-box selectors missed.
  const price = priceText || (doc.body?.textContent || '').match(/\$\s?\d{1,4}\.\d{2}/)?.[0] || null;

  return extractGeneric(doc, url, { title, priceText: price, specText });
}
