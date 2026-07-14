/* Text-parsing helpers shared by every retailer adapter. Pure string → data.
   These are the brittle bits; keep them isolated and well-tested. */

import type { CompositionPart, Fiber, YarnType } from '../engine/types';

/* Order matters: multi-word fibers before their single-word substrings. */
const FIBER_PATTERNS: { fiber: Fiber; pattern: RegExp }[] = [
  { fiber: 'organic-cotton', pattern: /organic\s+cotton/i },
  { fiber: 'recycled-polyester', pattern: /recycled\s+polyester/i },
  { fiber: 'pima-cotton', pattern: /(pima|supima)\s*(cotton)?/i },
  { fiber: 'combed-cotton', pattern: /combed\s+cotton/i },
  { fiber: 'merino', pattern: /merino/i },
  { fiber: 'cashmere', pattern: /cashmere/i },
  { fiber: 'wool', pattern: /\bwool\b/i },
  { fiber: 'linen', pattern: /\blinen\b/i },
  { fiber: 'silk', pattern: /\bsilk\b/i },
  { fiber: 'tencel', pattern: /tencel|lyocell/i },
  { fiber: 'modal', pattern: /\bmodal\b/i },
  { fiber: 'bamboo', pattern: /bamboo/i },
  { fiber: 'viscose', pattern: /viscose|rayon/i },
  { fiber: 'polyester', pattern: /polyester/i },
  { fiber: 'nylon', pattern: /nylon|polyamide/i },
  { fiber: 'elastane', pattern: /elastane|spandex|lycra/i },
  { fiber: 'acrylic', pattern: /acrylic/i },
  { fiber: 'bonded-leather', pattern: /bonded\s+leather|pu\s+leather/i },
  { fiber: 'cotton', pattern: /cotton/i },
];

function matchFiber(text: string): Fiber | null {
  for (const { fiber, pattern } of FIBER_PATTERNS) if (pattern.test(text)) return fiber;
  return null;
}

/** Parse "60% Cotton, 40% Polyester" / "100% Ring-Spun Cotton" into parts. */
export function parseComposition(text: string): CompositionPart[] {
  const parts: CompositionPart[] = [];
  // Match "<n>% <fiber words>" chunks.
  const re = /(\d{1,3})\s*%\s*([A-Za-z][A-Za-z\s\-]*?)(?=(?:[,;/·•]|\band\b|\d{1,3}\s*%|$))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const percent = parseInt(m[1], 10);
    const fiber = matchFiber(m[2]);
    if (fiber && percent > 0 && percent <= 100) parts.push({ fiber, percent, raw: m[0].trim() });
  }
  // Fiber-first order ("Cotton 60%, Polyester 40%"), common on H&M / EU sites.
  if (!parts.length) {
    const reB = /([A-Za-z][A-Za-z\s\-]{1,24}?)\s*(\d{1,3})\s*%/g;
    let mb: RegExpExecArray | null;
    while ((mb = reB.exec(text)) !== null) {
      const fiber = matchFiber(mb[1]);
      const percent = parseInt(mb[2], 10);
      if (fiber && percent > 0 && percent <= 100) parts.push({ fiber, percent, raw: mb[0].trim() });
    }
  }
  // Fallback: a bare fiber name with no percentage ("Cotton") → assume 100%.
  if (!parts.length) {
    const fiber = matchFiber(text);
    if (fiber) parts.push({ fiber, percent: 100, raw: text.trim().slice(0, 60) });
  }
  // Drop identical fragments first — the same "100% Cotton" can appear in several
  // spec sources (blob + DOM), and summing those would double the percentage.
  // Distinct fragments (genuine blends like 60% cotton / 40% poly) still sum.
  const deduped: CompositionPart[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = `${p.fiber}:${p.percent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(p);
  }
  const merged = new Map<Fiber, CompositionPart>();
  for (const p of deduped) {
    const cur = merged.get(p.fiber);
    if (cur) cur.percent = Math.min(100, cur.percent + p.percent);
    else merged.set(p.fiber, { ...p });
  }
  return [...merged.values()];
}

/** Parse fabric weight in GSM ("185 GSM", "185 g/m²", "180gsm"). */
export function parseGsm(text: string): number | null {
  const m = text.match(/(\d{2,4})\s*(?:gsm|g\/m²|g\/m2|g\.?s\.?m)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 60 && n <= 600) return n;
  }
  return null;
}

export function parseYarn(text: string): YarnType {
  if (/ring[-\s]?spun/i.test(text)) return 'ring-spun';
  if (/combed/i.test(text)) return 'combed';
  if (/open[-\s]?end/i.test(text)) return 'open-end';
  return 'unknown';
}

export function parseConstructionSignals(text: string): string[] {
  const cues = [
    /double[-\s]?stitch\w*/i,
    /triple[-\s]?stitch\w*/i,
    /flat[-\s]?lock\w*/i,
    /link(?:ed)?[-\s]?seam\w*/i,
    /fully[-\s]?fashioned/i,
    /reinforced[\w\s]*/i,
    /side[-\s]?seam\w*/i,
    /taped\s+(?:neck|shoulder)\w*/i,
  ];
  const found = new Set<string>();
  for (const c of cues) {
    const m = text.match(c);
    if (m) found.add(m[0].trim());
  }
  return [...found];
}

/** Parse a price from a string, tolerant of currency symbols and thousands. */
export function parsePrice(text: string): number | null {
  const m = text.replace(/,/g, '').match(/(?:[$£€]|USD|GBP|EUR)?\s*(\d{1,5}(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function guessCategory(text: string): 'tshirt' | 'knit' | 'unknown' {
  if (/\b(t[-\s]?shirt|tee|top|polo)\b/i.test(text)) return 'tshirt';
  if (/\b(sweater|knit|jumper|cardigan|pullover|crew)\b/i.test(text)) return 'knit';
  return 'unknown';
}
