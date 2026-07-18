/* The MaterialIQ rubric — versioned, published, reproducible.
   This file IS the methodology docs in code form. Change it → bump RUBRIC_VERSION
   and log it. The UI prints RUBRIC_VERSION so any score can be reproduced. */

import type { Fiber, YarnType } from './types';

export const RUBRIC_VERSION = 'v1.1.0-usecase';

/* Per-fiber base quality, 0–10. Straight from the methodology material-score table. */
export const FIBER_SCORES: Record<Fiber, number> = {
  'organic-cotton': 10,
  cashmere: 10,
  merino: 10,
  wool: 9,
  linen: 9,
  silk: 9,
  'pima-cotton': 9.5,
  'combed-cotton': 9,
  cotton: 9,
  tencel: 8,
  modal: 7,
  viscose: 6,
  bamboo: 6,
  'recycled-polyester': 5.5,
  polyester: 5,
  nylon: 5,
  elastane: 5, // structural, small % — neutral
  acrylic: 4,
  'bonded-leather': 2,
  unknown: 5,
};

/* Human-readable fiber names for UI/detail strings. */
export const FIBER_LABELS: Record<Fiber, string> = {
  'organic-cotton': 'organic cotton',
  cashmere: 'cashmere',
  merino: 'merino wool',
  wool: 'wool',
  linen: 'linen',
  silk: 'silk',
  'pima-cotton': 'pima cotton',
  'combed-cotton': 'combed cotton',
  cotton: 'cotton',
  tencel: 'Tencel',
  modal: 'modal',
  viscose: 'viscose',
  bamboo: 'bamboo',
  'recycled-polyester': 'recycled polyester',
  polyester: 'polyester',
  nylon: 'nylon',
  elastane: 'elastane',
  acrylic: 'acrylic',
  'bonded-leather': 'bonded leather',
  unknown: 'unlabeled fiber',
};

/* GSM banding for t-shirts. 180–220 mid-weight scores highest.
   Returns { score 0–10, label }. */
export function gsmScore(gsm: number): { score: number; label: string } {
  if (gsm < 120) return { score: 2.5, label: 'very light, likely to be sheer' };
  if (gsm < 150) return { score: 5, label: 'lightweight' };
  if (gsm < 180) return { score: 8, label: 'light-mid weight' };
  if (gsm <= 220) return { score: 10, label: 'mid-weight, the sweet spot for tees' };
  if (gsm <= 260) return { score: 8.5, label: 'heavyweight' };
  return { score: 7, label: 'very heavy' };
}

/* Yarn quality contribution to construction. */
export const YARN_BONUS: Record<YarnType, { bonus: number; label: string }> = {
  'ring-spun': { bonus: 2, label: 'ring-spun, smoother and more durable than open-end' },
  combed: { bonus: 2.5, label: 'combed, long fibers removed for strength and softness' },
  'open-end': { bonus: -1, label: 'open-end yarn, cheaper, coarser, pills sooner' },
  unknown: { bonus: 0, label: '' },
};

/* Construction cue keywords → durability bonus. Matched against page text. */
export const CONSTRUCTION_CUES: { pattern: RegExp; bonus: number; label: string }[] = [
  { pattern: /double[-\s]?stitch/i, bonus: 1, label: 'double-stitched seams' },
  { pattern: /triple[-\s]?stitch/i, bonus: 1.4, label: 'triple-stitched seams' },
  { pattern: /flat[-\s]?lock/i, bonus: 1, label: 'flatlock seams' },
  { pattern: /link(ed)?[-\s]?seam/i, bonus: 1.2, label: 'linked seams' },
  { pattern: /fully[-\s]?fashion/i, bonus: 1.2, label: 'fully-fashioned knit' },
  { pattern: /reinforced/i, bonus: 0.8, label: 'reinforced stress points' },
  { pattern: /side[-\s]?seam/i, bonus: 0.6, label: 'side-seamed (holds shape better than tubular)' },
  { pattern: /taped (neck|shoulder)/i, bonus: 0.7, label: 'taped neck/shoulders' },
];

/* Factor weights for the quality composite. Fabric weight is redistributed
   onto materials + construction when GSM is unavailable. */
export const QUALITY_WEIGHTS = {
  materials: 0.45,
  construction: 0.35,
  fabricWeight: 0.2,
} as const;

/* Overall = quality and value blended. */
export const OVERALL_WEIGHTS = { quality: 0.6, value: 0.4 } as const;

/* Category price model: fair price ≈ base + perPoint × qualityScore.
   Used only when we have no market comparables to compare against. */
export const PRICE_MODEL: Record<string, { base: number; perPoint: number }> = {
  tshirt: { base: 6, perPoint: 3.4 }, // quality 9 ≈ $37 fair
  knit: { base: 20, perPoint: 12 }, // quality 9 ≈ $128 fair
  unknown: { base: 10, perPoint: 6 },
};

/* Verdict thresholds on the 0–10 overall. */
export const VERDICT_THRESHOLDS = { worth: 7.5, skip: 5.0 } as const;
