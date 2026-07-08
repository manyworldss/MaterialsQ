/* Content script: extract → score → inject the badge, and answer the popup.
   Runs only on RETAILER_ORIGINS. Everything is rendered inside a Shadow DOM so
   the retailer's stylesheet can never touch (or be touched by) the badge. */

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import tokensRaw from '../design-system/tokens.css?raw';
import { analyze } from '../engine/score';
import type { Analysis, Product } from '../engine/types';
import { extractProduct } from '../extraction';
import { extractReviews } from '../extraction/reviews';
import { getSettings } from '../lib/settings';
import { fetchReviewSummary } from '../lib/reviews';
import type { AnalysisResponse, MIQMessage } from '../lib/messages';
import { InlineBadge } from './InlineBadge';

let currentAnalysis: Analysis | null = null;
let currentReason: AnalysisResponse['reason'];

const DOCS_URL = chrome.runtime.getURL('src/options/index.html') + '#methodology';

/* Re-scope tokens from :root onto :host so var() resolves inside the shadow. */
const HOST_TOKENS = tokensRaw.replace(/:root/g, ':host');

/* Make the two brand fonts available to the shadow tree (fonts are document-level). */
function ensureFonts() {
  if (document.getElementById('miq-fonts')) return;
  const link = document.createElement('link');
  link.id = 'miq-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..800&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}

/* Find where to place the badge — next to the price if we can, else float it. */
function findAnchor(price: number | null): { el: Element; inline: boolean } {
  const selectors = ['[class*="price"]', '[data-testid*="price"]', 'span[itemprop="price"]'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent && (price == null || el.textContent.includes(String(Math.round(price))))) {
      return { el, inline: true };
    }
  }
  return { el: document.body, inline: false };
}

function mountBadge(analysis: Analysis) {
  if (document.getElementById('miq-badge-host')) return;
  ensureFonts();

  const { el, inline } = findAnchor(analysis.product.price);
  const host = document.createElement('span');
  host.id = 'miq-badge-host';
  if (inline) {
    host.style.marginLeft = '10px';
    host.style.verticalAlign = 'middle';
    el.insertAdjacentElement('afterend', host);
  } else {
    host.style.position = 'fixed';
    host.style.right = '20px';
    host.style.bottom = '20px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);
  }

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = HOST_TOKENS + ':host{all:initial;}';
  shadow.appendChild(style);
  const mount = document.createElement('div');
  shadow.appendChild(mount);

  createRoot(mount).render(
    <StrictMode>
      <InlineBadge analysis={analysis} docsUrl={DOCS_URL} />
    </StrictMode>,
  );
}

async function run() {
  const settings = await getSettings();
  const product = extractProduct();
  if (!product) {
    currentReason = 'no-product';
    return;
  }
  if (product.extractionConfidence < settings.minConfidence) {
    currentReason = 'low-confidence';
    return;
  }

  const analysis = analyze(product);
  currentAnalysis = analysis;

  // Tell the service worker so it can badge the toolbar icon.
  chrome.runtime.sendMessage({ type: 'MIQ_VERDICT', verdict: analysis.verdict }).catch(() => {});

  if (settings.showInlineBadge) mountBadge(analysis);

  // Enrich with AI-summarized reviews in the background. Re-scores so the
  // durability signal from reviews is reflected, and updates what the popup sees.
  void enrichWithReviews(product);
}

async function enrichWithReviews(product: Product) {
  const reviews = extractReviews();
  if (reviews.length === 0) return;
  const summary = await fetchReviewSummary(product.title, reviews);
  if (!summary) return;
  const enriched = analyze({ ...product, reviews: summary });
  currentAnalysis = enriched;
}

// Answer the popup's request for the current analysis.
chrome.runtime.onMessage.addListener((msg: MIQMessage, _sender, sendResponse) => {
  if (msg.type === 'MIQ_GET_ANALYSIS') {
    sendResponse({ type: 'MIQ_ANALYSIS', analysis: currentAnalysis, reason: currentReason } satisfies AnalysisResponse);
  }
  return true;
});

// SPAs (Uniqlo) swap products without a full reload — re-run on URL change.
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    currentAnalysis = null;
    document.getElementById('miq-badge-host')?.remove();
    setTimeout(run, 800); // let the SPA hydrate the new PDP
  }
}).observe(document.body, { childList: true, subtree: true });

run();
