/* MaterialIQ review-summarization API.
   POST /api/summarize { title, reviews[], url? } -> { count, pros[], cons[], durabilitySignal }
   The extension scrapes review text client-side and posts it here; the API key
   and the model call stay server-side. Summaries are cached by product identity. */

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { summarizeReviews, type ReviewSummaryResult } from './summarize.js';
import { explainAnalysis, type ExplainFacts, type ExplainResult } from './explain.js';
import { RateLimiter } from './ratelimit.js';
import { PersistentCache, UpstashCache, type ICache, productKeyFromUrl } from './cache.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS: allow the beta retailer origins, materialiq.app, local dev, and chrome-extension:// origins.
const DEFAULT_ORIGINS = [
  'https://www.uniqlo.com',
  'https://www2.hm.com',
  'https://www.amazon.com',
  'https://materialiq.app',
  'https://www.materialiq.app',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'http://localhost:8787',
];
const allowed = new Set((process.env.MIQ_ALLOWED_ORIGINS?.split(',') ?? DEFAULT_ORIGINS).map((s) => s.trim()));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || origin.startsWith('chrome-extension://') || allowed.has(origin)) return cb(null, true);
      // Fallback: allow same-site subdomains or pass false instead of throwing
      if (origin.endsWith('materialiq.app')) return cb(null, true);
      cb(null, false);
    },
  }),
);

// Cache initialization: Prefer Upstash Redis if credentials exist, fallback to local persistent cache.
const CACHE_TTL_DAYS = Number(process.env.MIQ_CACHE_TTL_DAYS ?? 30);
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
let cache: ICache<ReviewSummaryResult>;

let explainCache: ICache<ExplainResult>;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log('[cache] Initializing Upstash Redis cache');
  cache = new UpstashCache<ReviewSummaryResult>(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    CACHE_TTL_DAYS * 24 * 60 * 60, // TTL in seconds for Redis
  );
  // Shares the Redis instance; explanation keys are prefixed 'ex:' at the call
  // site so they never collide with summary keys ('p:' / 'h:').
  explainCache = new UpstashCache<ExplainResult>(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    CACHE_TTL_DAYS * 24 * 60 * 60,
  );
} else {
  console.log('[cache] Initializing local persistent file cache');
  const CACHE_FILE = process.env.MIQ_CACHE_FILE || 'summary-cache.json';
  cache = new PersistentCache<ReviewSummaryResult>(CACHE_FILE, CACHE_TTL_MS, 5000);
  explainCache = new PersistentCache<ExplainResult>(process.env.MIQ_EXPLAIN_CACHE_FILE || 'explain-cache.json', CACHE_TTL_MS, 5000);
}

// Per-IP rate limits for the paid AI endpoints. Free app → these cap how fast a
// single actor can run up our Anthropic bill. Cache hits still serve instantly;
// only genuine model calls draw from the budget, but we limit at the edge anyway.
const aiLimiter = new RateLimiter(Number(process.env.MIQ_AI_RATE_MAX ?? 30), Number(process.env.MIQ_AI_RATE_WINDOW_MS ?? 60_000));
setInterval(() => aiLimiter.sweep(), 5 * 60_000).unref?.();

function clientIp(req: express.Request): string {
  // Railway/proxies set x-forwarded-for; take the first hop. Fall back to socket.
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0];
  return (first || req.socket.remoteAddress || 'unknown').trim();
}

// Key by product identity (normalized URL) when available, so color/size variants
// and tracking params collapse to one entry. Fall back to a content hash.
function cacheKey(url: string | undefined, title: string, reviews: string[]): string {
  const pk = productKeyFromUrl(url);
  if (pk) return `p:${pk}`;
  return `h:${createHash('sha256').update(title + ' ' + reviews.join(' ')).digest('hex')}`;
}

app.get('/health', (_req, res) => res.json({ ok: true, model: process.env.MIQ_MODEL || 'claude-opus-4-8', cacheSize: cache.size }));

app.post('/api/summarize', async (req, res) => {
  const { title, reviews, url } = req.body ?? {};
  if (typeof title !== 'string' || !Array.isArray(reviews) || reviews.some((r) => typeof r !== 'string')) {
    return res.status(400).json({ error: 'Expected { title: string, reviews: string[], url?: string }' });
  }
  if (reviews.length === 0) return res.json({ count: 0, pros: [], cons: [], durabilitySignal: 3 });

  const key = cacheKey(typeof url === 'string' ? url : undefined, title, reviews);
  const hit = await cache.get(key);
  if (hit) return res.json({ ...hit, cached: true });

  // Rate-limit only genuine (uncached) model calls.
  if (!aiLimiter.take(clientIp(req))) return res.status(429).json({ error: 'Rate limit exceeded, try again shortly' });

  try {
    const result = await summarizeReviews(title, reviews);
    await cache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error('[summarize] failed:', err);
    res.status(502).json({ error: 'Summarization failed' });
  }
});

// AI explanation: turn the engine's deterministic facts into one plain-English
// paragraph. The client sends ONLY facts the rubric already computed; the model
// never sets the score. Cached by product identity + a hash of the facts (so a
// rubric change or a different product yields a fresh explanation).
app.post('/api/explain', async (req, res) => {
  const facts = req.body?.facts as ExplainFacts | undefined;
  const url = typeof req.body?.url === 'string' ? (req.body.url as string) : undefined;
  if (
    !facts ||
    typeof facts.title !== 'string' ||
    typeof facts.useCaseLabel !== 'string' ||
    !['worth', 'fair', 'skip'].includes(facts.verdict) ||
    typeof facts.composition !== 'string' ||
    !Array.isArray(facts.factors)
  ) {
    return res.status(400).json({ error: 'Expected { facts: ExplainFacts, url?: string }' });
  }

  // Bound the input: cap string lengths and factor count so a crafted payload
  // can't inflate a request. These are generous for real product data.
  const bounded: ExplainFacts = {
    title: facts.title.slice(0, 200),
    useCaseLabel: facts.useCaseLabel.slice(0, 60),
    verdict: facts.verdict,
    composition: facts.composition.slice(0, 300),
    materialNote: (facts.materialNote ?? '').slice(0, 400),
    brandCaption: facts.brandCaption ? String(facts.brandCaption).slice(0, 300) : null,
    factors: facts.factors.slice(0, 6).map((f) => ({ label: String(f.label).slice(0, 40), value: Number(f.value) || 0, max: Number(f.max) || 10 })),
  };

  // Key on product identity + a hash of the exact facts, so identical inputs
  // reuse one explanation and a rubric change invalidates it.
  const pk = productKeyFromUrl(url);
  const factHash = createHash('sha256').update(JSON.stringify(bounded)).digest('hex').slice(0, 16);
  const key = `ex:${pk ?? 'nourl'}:${factHash}`;
  const hit = await explainCache.get(key);
  if (hit) return res.json({ ...hit, cached: true });

  if (!aiLimiter.take(clientIp(req))) return res.status(429).json({ error: 'Rate limit exceeded, try again shortly' });

  try {
    const result = await explainAnalysis(bounded);
    if (result.explanation) await explainCache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error('[explain] failed:', err);
    res.status(502).json({ error: 'Explanation failed' });
  }
});

// Waitlist capture for the landing page. Appends to waitlist.jsonl — swap for a
// real datastore/email provider (e.g. Loops, Resend) before launch.
app.post('/api/waitlist', async (req, res) => {
  const email = req.body?.email;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  try {
    await appendFile('waitlist.jsonl', JSON.stringify({ email, at: new Date().toISOString() }) + '\n');
    res.json({ ok: true });
  } catch (err) {
    console.error('[waitlist] failed:', err);
    res.status(500).json({ error: 'Could not save' });
  }
});

// Affiliate redirect endpoint.
// Wraps the outbound merchant URL in the Skimlinks redirect using our publisher
// ID (set SKIMLINKS_ID). Doing it server-side keeps the ID out of the extension
// bundle and survives client-side ad-blockers. Falls back to a direct redirect
// if SKIMLINKS_ID is unset (e.g. local dev), so links always work.
const SKIMLINKS_ID = process.env.SKIMLINKS_ID?.trim();
app.get('/api/go', (req, res) => {
  const target = req.query.target;
  if (typeof target !== 'string' || !/^https?:\/\//.test(target)) {
    return res.status(400).send('Invalid target URL');
  }
  if (SKIMLINKS_ID) {
    // xs=1 marks this as an external (API) link per Skimlinks' redirector spec.
    const skim = `https://go.skimresources.com/?id=${encodeURIComponent(SKIMLINKS_ID)}&xs=1&url=${encodeURIComponent(target)}`;
    return res.redirect(302, skim);
  }
  return res.redirect(302, target);
});

// Serve the built landing page (web/dist) from this same service, so one Railway
// domain hosts both the marketing site and the /api routes above (single origin
// for Skimlinks to approve). Skipped if the build isn't present (pure API dev).
const WEB_DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  // SPA fallback: any non-API GET returns index.html.
  app.get(/^\/(?!api\/|health$).*/, (_req, res) => res.sendFile(resolve(WEB_DIST, 'index.html')));
  console.log(`[web] Serving landing page from ${WEB_DIST}`);
} else {
  console.log(`[web] No landing build at ${WEB_DIST} — API only.`);
}

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => {
  console.log(`MaterialIQ summarizer on :${PORT} (model ${process.env.MIQ_MODEL || 'claude-opus-4-8'})`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn('⚠  ANTHROPIC_API_KEY is not set — /api/summarize will fail.');
});
