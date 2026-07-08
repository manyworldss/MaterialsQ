/* Seed comparables dataset. In production this is a backend lookup keyed by
   category + quality band; here it's a small hand-seeded table so "similar
   quality, less" works end-to-end today. Clearly a stand-in, not the real index. */

import type { Comparable } from './types';

export const COMPARABLES: Record<'tshirt' | 'knit' | 'unknown', Comparable[]> = {
  tshirt: [
    { name: 'H&M Regular Fit Tee', retailer: 'hm.com', price: 19.99, qualityScore: 7.2 },
    { name: 'Uniqlo Supima Cotton Tee', retailer: 'uniqlo.com', price: 19.9, qualityScore: 8.0 },
    { name: 'Gildan Softstyle Tee', retailer: 'amazon.com', price: 8.5, qualityScore: 6.4 },
    { name: 'Everlane Organic Cotton Tee', retailer: 'everlane.com', price: 30.0, qualityScore: 8.6 },
  ],
  knit: [
    { name: 'Uniqlo Extra Fine Merino', retailer: 'uniqlo.com', price: 49.9, qualityScore: 8.7 },
    { name: 'H&M Fine-Knit Wool-Blend', retailer: 'hm.com', price: 39.99, qualityScore: 7.4 },
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
