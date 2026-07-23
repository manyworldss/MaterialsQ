/* Generic adapter — works on any retailer that ships schema.org Product JSON-LD
   or OpenGraph product tags, plus a bounded scan for composition/weight text.
   Retailer-specific adapters extend this and override the weak spots. */

import type { Product } from '../../engine/types';
import { guessCategory, parseComposition, parseConstructionSignals, parseGsm, parsePrice, parseYarn } from '../parse';

export interface JsonLdProduct {
  name?: string;
  material?: string;
  description?: string;
  price?: number | null;
  currency?: string;
}

const norm = (s?: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Pull schema.org Products out of any JSON-LD blocks (handles @graph). When
    `preferredName` is given (the page's real product title), returns the Product
    whose name matches it — a PDP often carries several Products (main item plus
    "related"/breadcrumb entries), and the first is not always the graded one. */
export function readJsonLd(doc: Document, preferredName?: string): JsonLdProduct | null {
  const candidates: JsonLdProduct[] = [];
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const block of Array.from(blocks)) {
    let data: unknown;
    try {
      data = JSON.parse(block.textContent || '');
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : (data as { '@graph'?: unknown })['@graph'] ?? [data];
    for (const node of nodes as Record<string, unknown>[]) {
      const type = node?.['@type'];
      const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
      if (!isProduct) continue;
      const offers = ([] as Record<string, unknown>[]).concat((node.offers as Record<string, unknown>) ?? []);
      const offer = offers[0] ?? {};
      const price = offer.price != null ? parsePrice(String(offer.price)) : null;
      candidates.push({
        name: typeof node.name === 'string' ? node.name : undefined,
        material: typeof node.material === 'string' ? node.material : undefined,
        description: typeof node.description === 'string' ? node.description : undefined,
        price,
        currency: typeof offer.priceCurrency === 'string' ? offer.priceCurrency : undefined,
      });
    }
  }
  if (!candidates.length) return null;
  if (preferredName) {
    const target = norm(preferredName);
    const match = candidates.find((c) => {
      const n = norm(c.name);
      return n && (n === target || (target.length >= 8 && (n.includes(target.slice(0, 16)) || target.includes(n.slice(0, 16)))));
    });
    if (match) return match;
  }
  return candidates[0];
}

/* Regions that hold OTHER products — recommendations, related items, recently
   viewed, cross-sells, breadcrumbs, nav, footer. We must never read the graded
   product's specs from these, or a "You may also like" item's fabric can
   silently override the real one. */
const EXCLUDED_REGION =
  /(recommend|related|you[-\s]?may|similar|recently[-\s]?viewed|also[-\s]?(bought|viewed|like|purchased)|complete[-\s]?the[-\s]?look|shop[-\s]?the[-\s]?look|customers[-\s]?also|cross[-\s]?sell|upsell|carousel|slider|suggest|more[-\s]?like|pairs[-\s]?with|breadcrumb|site[-\s]?nav|megamenu)/i;

/** True if the node sits inside a recommendations/related/nav/footer region,
    detected by id, class, data-testid, aria-label, or structural tag. */
export function inExcludedRegion(node: Element, root: Element): boolean {
  const stopAt = root.parentElement;
  for (let el: Element | null = node; el && el !== stopAt; el = el.parentElement) {
    const tag = el.tagName;
    if (tag === 'NAV' || tag === 'FOOTER') return true;
    const hay = `${el.id} ${el.getAttribute('class') ?? ''} ${el.getAttribute('data-testid') ?? ''} ${el.getAttribute('aria-label') ?? ''}`;
    if (EXCLUDED_REGION.test(hay)) return true;
  }
  return false;
}

/** Best-effort main-product container to scope spec scanning. Prefer the
    semantic main region, but only when it actually contains the product title —
    otherwise fall back to <body>. Recommendation regions inside it are still
    excluded separately. */
export function findProductRoot(doc: Document): Element {
  const main = doc.querySelector('main, [role="main"]');
  if (main && (main.querySelector('h1') || main.querySelector('[itemprop="name"]'))) return main;
  return doc.body || doc.documentElement;
}

export function readMeta(doc: Document, names: string[]): string | null {
  for (const n of names) {
    const el = doc.querySelector(`meta[property="${n}"], meta[name="${n}"]`);
    const c = el?.getAttribute('content');
    if (c) return c;
  }
  return null;
}

/* Gather a bounded set of text snippets likely to hold composition / weight /
   construction info — scoped to the main product region and skipping any
   recommendation/related subtrees, so we never read a different item's specs. */
export function collectSpecText(root: Element): string {
  const KEY = /(composition|material|fabric|cotton|polyester|wool|linen|viscose|cashmere|nylon|acrylic|gsm|g\/m|ring[-\s]?spun|stitch|seam|knit|fashioned|reinforced|taped|% )/i;
  const out: string[] = [];
  const nodes = root.querySelectorAll('li, dd, dt, td, th, p, span, div');
  for (const node of Array.from(nodes)) {
    if (out.length > 40) break;
    if (inExcludedRegion(node, root)) continue;
    const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length > 4 && t.length < 240 && KEY.test(t)) out.push(t);
  }
  // De-dupe while preserving order.
  return Array.from(new Set(out)).join(' · ').slice(0, 4000);
}

/* SPA fallback: many retailers (Uniqlo included) ship product data in an inline
   state blob (__NEXT_DATA__, __PRELOADED_STATE__, apollo cache) rather than the
   DOM. We don't parse the whole JSON — we pull the composition / GSM fragments
   out of the raw script text, which survives minification. Bounded per script. */
export function scanScriptsForSpecs(doc: Document): string {
  const found = new Set<string>();
  const scripts = doc.querySelectorAll('script:not([type="application/ld+json"])');
  const FRAG = /(\d{1,3}\s*%\s*[A-Za-z][A-Za-z\s\-]{2,20}|\d{2,4}\s*(?:gsm|g\/m²|g\/m2)|ring[-\s]?spun|open[-\s]?end|combed)/gi;
  for (const s of Array.from(scripts)) {
    const text = s.textContent || '';
    if (text.length < 20 || text.length > 500_000) continue;
    if (!/cotton|polyester|wool|linen|viscose|cashmere|nylon|acrylic|gsm|composition/i.test(text)) continue;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = FRAG.exec(text)) !== null && n < 20) {
      found.add(m[0].replace(/\s+/g, ' ').trim());
      n++;
    }
    if (found.size > 40) break;
  }
  return Array.from(found).join(' · ').slice(0, 2000);
}

export interface ExtractOptions {
  /** Retailer-specific price text (buy-box), tried before generic scan. */
  priceText?: string | null;
  /** Retailer-specific composition/spec text, merged with the generic scan. */
  specText?: string | null;
  /** Retailer-specific title override. */
  title?: string | null;
}

export function extractGeneric(doc: Document, url: string, opts: ExtractOptions = {}): Product | null {
  const host = new URL(url).hostname;

  // The page's real product title (og:title / h1) — used to pick the RIGHT
  // Product from JSON-LD when a page carries several.
  const pageTitle =
    opts.title || readMeta(doc, ['og:title']) || doc.querySelector('h1')?.textContent?.trim() || doc.title || '';
  const ld = readJsonLd(doc, pageTitle);

  const title = opts.title || ld?.name || pageTitle || 'Unknown product';

  const priceText =
    opts.priceText ||
    (ld?.price != null ? String(ld.price) : null) ||
    readMeta(doc, ['product:price:amount', 'og:price:amount']);
  const price = priceText ? parsePrice(priceText) : null;
  const currency = ld?.currency || readMeta(doc, ['product:price:currency', 'og:price:currency']) || 'USD';

  // Composition source, in order of trust:
  //  1. If the retailer adapter or JSON-LD already gave us fiber content for THIS
  //     product, use ONLY that — do not append the broad DOM/script scan, which
  //     can pull fabric from a recommendations carousel and win the parse.
  //  2. Otherwise scan the main product region (scoped + recommendation-excluded),
  //     and fall back to script blobs only when the DOM yields no fiber (SPA case).
  const FIBER = /(cotton|polyester|wool|linen|viscose|cashmere|nylon|acrylic|elastane|spandex|modal|silk|bamboo)/i;
  const provided = [opts.specText, ld?.material].filter(Boolean).join(' · ');
  let specText: string;
  if (FIBER.test(provided)) {
    specText = provided;
  } else {
    const domSpec = collectSpecText(findProductRoot(doc));
    const needScripts = !FIBER.test(`${ld?.material ?? ''} ${domSpec}`);
    specText = [opts.specText, ld?.material, ld?.description, domSpec, needScripts ? scanScriptsForSpecs(doc) : '']
      .filter(Boolean)
      .join(' · ');
  }

  const composition = parseComposition(specText);
  const gsm = parseGsm(specText);
  const yarn = parseYarn(specText);
  const constructionSignals = parseConstructionSignals(specText);
  const category = guessCategory(`${title} ${specText}`);

  const notes: string[] = [];
  if (!composition.length) notes.push('Fiber content not found on this page');
  if (gsm == null) notes.push('Fabric weight (GSM) not listed');
  if (price == null) notes.push('Price not found');

  // Confidence: reward the fields that actually drive the score.
  let confidence = 0.3;
  if (composition.length) confidence += 0.35;
  if (price != null) confidence += 0.2;
  if (gsm != null) confidence += 0.1;
  if (yarn !== 'unknown' || constructionSignals.length) confidence += 0.05;

  // Nothing to score on → not a product page we can rate.
  if (!composition.length && price == null) return null;

  return {
    title,
    retailer: host,
    url,
    price,
    currency,
    category,
    composition,
    gsm,
    yarn,
    origin: null,
    constructionSignals,
    extractionConfidence: Math.min(1, confidence),
    notes,
  };
}
