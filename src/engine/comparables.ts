/* Seed comparables dataset. In production this is a backend lookup keyed by
   category + quality band; here it's a small hand-seeded table so "similar
   quality, less" works end-to-end today. Clearly a stand-in, not the real index. */

import type { BetterOption, Comparable } from './types';

export const COMPARABLES: Record<'tshirt' | 'knit' | 'unknown', Comparable[]> = {
  tshirt: [
    { name: 'H&M Regular Fit Tee', retailer: 'hm.com', price: 19.99, qualityScore: 7.2, url: 'https://www2.hm.com/en_us/productpage.1102434001.html' },
    { name: 'Uniqlo Supima Cotton Tee', retailer: 'uniqlo.com', price: 19.9, qualityScore: 8.0, url: 'https://www.uniqlo.com/us/en/products/E422990-000/00' },
    { name: 'Gildan Softstyle Tee', retailer: 'amazon.com', price: 8.5, qualityScore: 6.4, url: 'https://www.amazon.com/dp/B004V81TMC' },
    { name: 'Amazon Essentials Crew Tee', retailer: 'amazon.com', price: 12.0, qualityScore: 6.8, url: 'https://www.amazon.com/dp/B079MC5TYD' },
    { name: 'Everlane Organic Cotton Tee', retailer: 'everlane.com', price: 30.0, qualityScore: 8.6, url: 'https://www.everlane.com/products/mens-organic-cotton-crew-tee-black' },
    { name: 'J.Crew Broken-in Tee', retailer: 'jcrew.com', price: 29.5, qualityScore: 8.3, url: 'https://www.jcrew.com/p/mens/categories/clothing/t-shirts/broken-in/broken-in-short-sleeve-t-shirt/BJ467' },
    { name: 'Buck Mason Pima Curved-Hem Tee', retailer: 'buckmason.com', price: 38.0, qualityScore: 9.0, url: 'https://www.buckmason.com/products/black-pima-curved-hem-tee' },
  ],
  knit: [
    { name: 'Uniqlo Extra Fine Merino', retailer: 'uniqlo.com', price: 49.9, qualityScore: 8.7, url: 'https://www.uniqlo.com/us/en/products/E460933-000/00' },
    { name: 'H&M Fine-Knit Wool-Blend', retailer: 'hm.com', price: 39.99, qualityScore: 7.4, url: 'https://www2.hm.com/en_us/productpage.1203485001.html' },
    { name: 'Everlane Merino Crew', retailer: 'everlane.com', price: 100.0, qualityScore: 9.0, url: 'https://www.everlane.com/products/mens-no-sweat-sweater-black' },
  ],
  unknown: [],
};

function median(nums: number[]): number | null {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Market reference = median price of comparables of *similar or better quality*.
   Comparing a quality tee against cheap blanks would wrongly call it overpriced,
   so we only look at items in the same quality band. */
export function marketReference(category: 'tshirt' | 'knit' | 'unknown', qualityScore: number): number | null {
  const band = COMPARABLES[category].filter((c) => c.qualityScore >= qualityScore - 1.0);
  return median((band.length ? band : COMPARABLES[category]).map((c) => c.price));
}

/** Best cheaper alternative of comparable-or-better quality. */
export function findAlternative(
  category: 'tshirt' | 'knit' | 'unknown',
  qualityScore: number,
  price: number | null,
): Comparable | null {
  if (price == null) return null;
  const candidates = COMPARABLES[category]
    .filter((c) => c.price < price * 0.92 && c.qualityScore >= qualityScore - 0.6)
    .sort((a, b) => b.qualityScore / b.price - a.qualityScore / a.price);
  return candidates[0] ?? null;
}

/** Cross-retailer options that beat this product on value (quality per dollar),
    each with a plain-English reason. Ranked best-value first. */
export function betterOptions(
  category: 'tshirt' | 'knit' | 'unknown',
  qualityScore: number,
  price: number | null,
  title: string,
  max = 3,
): BetterOption[] {
  if (price == null || price <= 0) return [];
  const currentValue = qualityScore / price;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const self = norm(title);

  return COMPARABLES[category]
    .filter((c) => !self.includes(norm(c.name)) && !norm(c.name).includes(self.slice(0, 12)))
    .map((c) => ({ c, value: c.qualityScore / c.price }))
    .filter(({ c, value }) => value > currentValue * 1.05 && c.qualityScore >= qualityScore - 1.2)
    .sort((a, b) => b.value - a.value)
    .slice(0, max)
    .map(({ c }): BetterOption => {
      let reason: string;
      if (c.price < price * 0.95 && c.qualityScore >= qualityScore - 0.4) {
        reason = `similar quality, $${Math.round(price - c.price)} less`;
      } else if (c.qualityScore > qualityScore + 0.4 && c.price <= price * 1.1) {
        reason = 'better materials for about the same';
      } else if (c.price < price) {
        reason = `${Math.round((1 - c.price / price) * 100)}% cheaper, close on quality`;
      } else {
        reason = 'stronger value overall';
      }
      return { name: c.name, retailer: c.retailer, price: c.price, qualityScore: c.qualityScore, reason, url: c.url };
    });
}
