/* Content script: extract → score → inject the badge, and answer the popup.
   Runs only on RETAILER_ORIGINS. Everything is rendered inside a Shadow DOM so
   the retailer's stylesheet can never touch (or be touched by) the badge. */

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import tokensRaw from '../design-system/tokens.css?raw';
import { analyze } from '../engine/score';
import type { Analysis, Product } from '../engine/types';
import { extractProduct, findProductRoot, inExcludedRegion } from '../extraction';
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
  link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400..800&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}

/* Find the on-page element that DISPLAYS the price, by matching the value —
   retailer-agnostic (class names vary; the price string doesn't). Scoped to the
   main product region and skipping recommendation carousels, so the badge
   anchors to THIS product's price, not a "you may also like" item's. Prefers the
   smallest (leaf) element so we anchor to the price itself, not a big container. */
function findPriceEl(price: number | null): Element | null {
  if (price == null) return null;
  const root = findProductRoot(document);
  const exact = price.toFixed(2); // "29.90"
  const nodes = root.querySelectorAll('span, div, p, b, strong, ins, bdi, [class*="price" i], [data-testid*="price" i], [itemprop="price"]');
  let best: Element | null = null;
  let bestLen = Infinity;
  for (const el of Array.from(nodes)) {
    if (inExcludedRegion(el, root)) continue;
    const t = (el.textContent || '').replace(/\s+/g, '');
    if (!t || t.length > 24) continue; // skip large containers
    // Match the exact value (with cents) to avoid latching onto a strikethrough
    // original price or an unrelated number.
    if (t.includes(exact) && t.length < bestLen) {
      best = el;
      bestLen = t.length;
    }
  }
  return best;
}

let badgeCleanup: (() => void) | null = null;

function removeBadge() {
  badgeCleanup?.();
  badgeCleanup = null;
  document.getElementById('miq-badge-host')?.remove();
}

/* Mount the badge as a body-level positioned overlay that TRACKS the price
   element. Because it lives on <body> (outside the retailer's React tree), the
   page's re-renders can't wipe it — the old sibling-injection approach got
   removed on re-render, which is why it "didn't always pop up". A light loop
   re-finds the price if React swaps the node and repositions on scroll/resize. */
function mountBadge(analysis: Analysis) {
  removeBadge();
  ensureFonts();

  const host = document.createElement('span');
  host.id = 'miq-badge-host';
  host.style.position = 'absolute';
  host.style.top = '-9999px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = HOST_TOKENS + ':host{all:initial;}';
  shadow.appendChild(style);
  const mount = document.createElement('div');
  shadow.appendChild(mount);
  const root = createRoot(mount);
  root.render(
    <StrictMode>
      <InlineBadge analysis={analysis} docsUrl={DOCS_URL} />
    </StrictMode>,
  );

  const BADGE_W = 130;
  const BADGE_H = 32;
  let anchor: Element | null = null;
  // Dock as a fixed corner chip. Used whenever anchoring beside the price would
  // overlap page content — never cover the buy box / CTA.
  const dockCorner = () => {
    host.style.position = 'fixed';
    host.style.top = host.style.left = '';
    host.style.right = '20px';
    host.style.bottom = '20px';
  };
  const reposition = () => {
    if (!anchor || !anchor.isConnected) anchor = findPriceEl(analysis.product.price); // re-find if React swapped it
    const r = anchor?.isConnected ? anchor.getBoundingClientRect() : null;
    // Only anchor beside the price when there's clear whitespace to its right.
    // Otherwise the badge would sit ON TOP of the CTA / price subtext, so we dock
    // it to the corner instead of covering content.
    if (r && (r.width || r.height) && window.innerWidth - r.right > BADGE_W + 16) {
      host.style.position = 'absolute';
      host.style.right = host.style.bottom = '';
      const top = window.scrollY + r.top + Math.max(0, (r.height - BADGE_H) / 2);
      let left = window.scrollX + r.right + 10;
      left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - BADGE_W - 8));
      host.style.top = `${top}px`;
      host.style.left = `${left}px`;
    } else {
      dockCorner();
    }
  };

  let raf = 0;
  const onScrollResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(reposition);
  };
  reposition();
  // Delayed passes catch late-hydrating prices; the interval keeps it pinned.
  const timers = [300, 900, 1800, 3200].map((d) => window.setTimeout(reposition, d));
  const interval = window.setInterval(reposition, 2000);
  window.addEventListener('scroll', onScrollResize, { passive: true });
  window.addEventListener('resize', onScrollResize, { passive: true });

  badgeCleanup = () => {
    timers.forEach(clearTimeout);
    clearInterval(interval);
    window.removeEventListener('scroll', onScrollResize);
    window.removeEventListener('resize', onScrollResize);
    cancelAnimationFrame(raf);
    root.unmount();
  };
}

async function run(attempt = 0) {
  const settings = await getSettings();
  const product = extractProduct();
  if (!product || product.extractionConfidence < settings.minConfidence) {
    currentReason = !product ? 'no-product' : 'low-confidence';
    // SPAs (Amazon, H&M) hydrate product data after document_idle — retry a few
    // times before giving up, so the badge appears once the page is ready.
    if (attempt < 5 && !currentAnalysis) setTimeout(() => run(attempt + 1), 800);
    return;
  }

  const analysis = analyze(product);
  currentAnalysis = analysis;

  // Tell the service worker so it can badge the toolbar icon.
  chrome.runtime.sendMessage({ type: 'MIQ_VERDICT', verdict: analysis.verdict }).catch(() => {});

  if (settings.showInlineBadge) {
    try {
      mountBadge(analysis);
    } catch (err) {
      console.warn('[MaterialIQ] badge mount failed:', err); // never break the score over the badge
    }
  }

  // Enrich with AI-summarized reviews only when enabled (off until the AI backend
  // launches). When off, the extension never contacts the backend.
  if (settings.reviewSummaries) void enrichWithReviews(product);
}

async function enrichWithReviews(product: Product) {
  const reviews = extractReviews();
  if (reviews.length === 0) return;
  const summary = await fetchReviewSummary(product.title, reviews, product.url);
  if (!summary) return;
  const enriched = analyze({ ...product, reviews: summary });
  currentAnalysis = enriched;
}

// Answer the popup/side panel: current analysis, or a fresh re-extraction.
chrome.runtime.onMessage.addListener((msg: MIQMessage, _sender, sendResponse) => {
  if (msg.type === 'MIQ_GET_ANALYSIS') {
    sendResponse({ type: 'MIQ_ANALYSIS', analysis: currentAnalysis, reason: currentReason } satisfies AnalysisResponse);
    return true;
  }
  if (msg.type === 'MIQ_RECHECK') {
    removeBadge();
    currentAnalysis = null;
    currentReason = undefined;
    run().then(() => sendResponse({ type: 'MIQ_ANALYSIS', analysis: currentAnalysis, reason: currentReason } satisfies AnalysisResponse));
    return true; // async response
  }
  return true;
});

// SPAs (Uniqlo) swap products without a full reload — re-run on URL change.
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    currentAnalysis = null;
    currentReason = undefined;
    removeBadge();
    setTimeout(() => run(), 800); // let the SPA hydrate the new PDP
  }
}).observe(document.body, { childList: true, subtree: true });

run();
