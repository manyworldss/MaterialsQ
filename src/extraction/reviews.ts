/* Client-side review scraping. We pull raw review text from the page and send it
   to the backend for summarization — the retailer's own reviews, read in place.
   No retailer review API needed. Bounded and best-effort. */

const REVIEW_SELECTORS = [
  '[data-hook="review-body"]', // Amazon
  '[class*="review-text"]',
  '[class*="reviewText"]',
  '[class*="review-content"]',
  '[itemprop="reviewBody"]',
  '[class*="review"] p',
];

export function extractReviews(doc: Document = document): string[] {
  const seen = new Set<string>();
  for (const sel of REVIEW_SELECTORS) {
    for (const node of Array.from(doc.querySelectorAll(sel))) {
      const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length >= 20 && t.length <= 1500) seen.add(t);
      if (seen.size >= 200) return [...seen];
    }
    if (seen.size >= 40) break; // a retailer-specific selector matched — stop widening
  }
  return [...seen];
}
