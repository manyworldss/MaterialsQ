/* Use-case scoring profiles — the category-aware layer.

   The same fiber means different things depending on what the garment is FOR:
   polyester is a liability in a cashmere-grade sweater but exactly right in a
   running tee. A flat fiber table can't express that, so each UseCase carries a
   ScoringProfile that reinterprets fibers, weights, GSM relevance, and the price
   model. Classification here is deterministic (rules) so the score stays
   reproducible; an AI layer may later refine the UseCase, but the math it feeds
   is still this pure, published table. */

import type { CategoryContext, Fiber, Product, UseCase } from './types';
import { FIBER_LABELS, FIBER_SCORES, PRICE_MODEL, QUALITY_WEIGHTS } from './rubric';

export interface ScoringProfile {
  useCase: UseCase;
  label: string;
  /** One line on what this use-case rewards. */
  blurb: string;
  /** Additive deltas to base FIBER_SCORES, clamped 0..10 at use. */
  fiberAdjust: Partial<Record<Fiber, number>>;
  /** Quality-composite weights for this use-case. */
  weights: { materials: number; construction: number; fabricWeight: number };
  /** Whether fabric weight (GSM) is a meaningful quality signal here.
      False for knits and performance wear, where GSM ≠ quality. */
  gsmMeaningful: boolean;
  /** Fibers that are an ideal fit — drives the "appropriate material" copy. */
  idealFibers: Fiber[];
  /** Fibers that are a poor fit — drives the "wrong material" copy. */
  poorFibers: Fiber[];
  /** Rough wears/year for cost-per-wear. */
  wearsPerYear: number;
  /** Fair-price model: base + perPoint × qualityScore. */
  price: { base: number; perPoint: number };
  /** Substance-price model: what a no-name maker of the SAME material and make
      would charge for this quality. The gap between asking price and this is the
      "brand premium". Deliberately lower than `price` (which is fair market). */
  substancePrice: { base: number; perPoint: number };
  /** Which comparables bucket this maps to (the seed index is coarser). */
  comparableCategory: 'tshirt' | 'knit' | 'unknown';
}

const SYNTHETIC: ReadonlySet<Fiber> = new Set<Fiber>([
  'polyester',
  'recycled-polyester',
  'nylon',
  'elastane',
  'acrylic',
]);

export const PROFILES: Record<UseCase, ScoringProfile> = {
  'everyday-tee': {
    useCase: 'everyday-tee',
    label: 'Everyday tee',
    blurb: 'Graded as an everyday tee: material, fabric weight, and construction.',
    fiberAdjust: {},
    weights: { ...QUALITY_WEIGHTS },
    gsmMeaningful: true,
    idealFibers: ['cotton', 'combed-cotton', 'pima-cotton', 'organic-cotton', 'linen'],
    poorFibers: ['polyester', 'acrylic'],
    wearsPerYear: 40,
    price: PRICE_MODEL.tshirt,
    // A no-logo quality tee (Uniqlo/blank tier): quality 9 ≈ $21.
    substancePrice: { base: 5, perPoint: 1.8 },
    comparableCategory: 'tshirt',
  },
  activewear: {
    useCase: 'activewear',
    label: 'Activewear',
    blurb: 'Graded on performance, not luxury — technical synthetics are a plus here.',
    // Synthetics reward performance; natural fibers hold sweat and dry slowly.
    fiberAdjust: {
      polyester: 3.5,
      'recycled-polyester': 3.5,
      nylon: 3,
      elastane: 3,
      acrylic: 1,
      cotton: -2,
      'combed-cotton': -1.5,
      'organic-cotton': -1.5,
      'pima-cotton': -1.5,
      linen: -3,
      viscose: -1,
    },
    weights: { materials: 0.55, construction: 0.35, fabricWeight: 0.1 },
    gsmMeaningful: false,
    idealFibers: ['polyester', 'recycled-polyester', 'nylon', 'elastane'],
    poorFibers: ['cotton', 'combed-cotton', 'organic-cotton', 'pima-cotton', 'linen'],
    wearsPerYear: 50,
    price: { base: 8, perPoint: 4 },
    // Generic technical tee: quality 9 ≈ $28. Performance branding runs a big premium.
    substancePrice: { base: 5, perPoint: 2.6 },
    comparableCategory: 'tshirt',
  },
  'luxury-knit': {
    useCase: 'luxury-knit',
    label: 'Fine knitwear',
    blurb: 'Graded as fine knitwear, where natural fibers and hand-feel matter most.',
    fiberAdjust: {
      acrylic: -1.5,
      polyester: -1.5,
      'recycled-polyester': -1,
      nylon: -1,
      viscose: -0.5,
      bamboo: -0.5,
    },
    weights: { materials: 0.55, construction: 0.35, fabricWeight: 0.1 },
    gsmMeaningful: false,
    idealFibers: ['cashmere', 'merino', 'wool', 'silk'],
    poorFibers: ['acrylic', 'polyester'],
    wearsPerYear: 25,
    price: PRICE_MODEL.knit,
    // No-name knit of the same fiber: quality 9 ≈ $84. Designer labels multiply it.
    substancePrice: { base: 12, perPoint: 8 },
    comparableCategory: 'knit',
  },
  'everyday-knit': {
    useCase: 'everyday-knit',
    label: 'Everyday knit',
    blurb: 'Graded as an everyday knit: material and construction over sticker weight.',
    fiberAdjust: { acrylic: -0.5 },
    weights: { materials: 0.5, construction: 0.35, fabricWeight: 0.15 },
    gsmMeaningful: false,
    idealFibers: ['cotton', 'wool', 'merino'],
    poorFibers: ['acrylic'],
    wearsPerYear: 25,
    price: { base: 16, perPoint: 9 },
    substancePrice: { base: 8, perPoint: 5 },
    comparableCategory: 'knit',
  },
  unknown: {
    useCase: 'unknown',
    label: 'Garment',
    blurb: 'Graded on general garment quality.',
    fiberAdjust: {},
    weights: { ...QUALITY_WEIGHTS },
    gsmMeaningful: true,
    idealFibers: [],
    poorFibers: [],
    wearsPerYear: 30,
    price: PRICE_MODEL.unknown,
    substancePrice: { base: 6, perPoint: 3 },
    comparableCategory: 'unknown',
  },
};

export function profileFor(useCase: UseCase): ScoringProfile {
  return PROFILES[useCase] ?? PROFILES.unknown;
}

/** Base fiber score adjusted for the use-case, clamped to 0..10. */
export function effectiveFiberScore(fiber: Fiber, profile: ScoringProfile): number {
  const v = FIBER_SCORES[fiber] + (profile.fiberAdjust[fiber] ?? 0);
  return Math.max(0, Math.min(10, v));
}

/* ---- Deterministic use-case classification ---- */

// Unambiguous performance product types — these are almost never lifestyle wear,
// so composition can't override them.
const UNAMBIGUOUS_ACTIVE =
  /\b(compression|legging|base[\s-]?layer|dri[\s-]?fit|dry[\s-]?ex|moisture[\s-]?wick(?:ing)?|wicking|rash[\s-]?guard|cycling jersey|sports bra)\b/i;
// Softer signals — could be genuine performance wear OR "athleisure" styled in a
// natural fiber. Only treat as activewear when the fabric backs it up.
const MODERATE_ACTIVE =
  /\b(sport|sports|athletic|active[\s-]?wear|training|workout|work[\s-]?out|gym|running|yoga|pilates|performance|quick[\s-]?dry|jogger|tennis|golf)\b/i;
const KNIT_WORDS = /\b(sweater|jumper|cardigan|pullover|knit|turtleneck)\b/i;
const LUX_WORDS = /\b(cashmere|merino|lambswool|alpaca|mohair|silk)\b/i;
const TEE_WORDS = /\b(t[-\s]?shirt|tee|polo|top)\b/i;

function share(comp: Product['composition'], fibers: Fiber[]): number {
  const set = new Set(fibers);
  return comp.filter((p) => set.has(p.fiber)).reduce((s, p) => s + p.percent, 0);
}

/** Classify a garment's use-case from its title, construction cues, coarse
    category, and composition. Deterministic and reproducible. */
export function detectUseCase(product: Product): UseCase {
  const text = `${product.title} ${product.constructionSignals.join(' ')}`;
  const comp = product.composition;
  const synthShare = share(comp, ['polyester', 'recycled-polyester', 'nylon', 'elastane', 'acrylic']);
  const naturalShare = share(comp, [
    'cotton',
    'combed-cotton',
    'organic-cotton',
    'pima-cotton',
    'linen',
    'wool',
    'merino',
    'cashmere',
    'silk',
  ]);
  const luxShare = share(comp, ['cashmere', 'merino', 'wool', 'silk']);

  // Activewear: unambiguous product types always qualify. Softer signals only
  // qualify when the fabric is synthetic-dominant (or not natural-dominant) — this
  // is what keeps a "AIRism Cotton Tee" from being mis-graded as performance wear.
  if (UNAMBIGUOUS_ACTIVE.test(text)) return 'activewear';
  if (MODERATE_ACTIVE.test(text) && (synthShare >= 45 || naturalShare < 50)) return 'activewear';

  const isKnit = product.category === 'knit' || KNIT_WORDS.test(text);
  if (isKnit) {
    if (luxShare >= 30 || LUX_WORDS.test(text)) return 'luxury-knit';
    return 'everyday-knit';
  }

  if (product.category === 'tshirt' || TEE_WORDS.test(text)) return 'everyday-tee';
  return 'unknown';
}

/* ---- Plain-English material-fit note (the Objective-2 headline line) ---- */

/** Build the display context: how the use-case framed the grade, and whether the
    primary material is a good fit for it. Deterministic; the AI layer may rephrase
    `materialNote` but the substance (and `appropriate`) is decided here. */
export function buildCategoryContext(
  product: Product,
  profile: ScoringProfile,
  aiClassified = false,
): CategoryContext {
  const base = {
    useCase: profile.useCase,
    label: profile.label,
    blurb: profile.blurb,
    aiClassified,
  };
  const parts = product.composition.filter((p) => p.percent > 0);
  const primary = [...parts].sort((a, b) => b.percent - a.percent)[0]?.fiber;

  if (!primary || primary === 'unknown' || profile.useCase === 'unknown') {
    return { ...base, appropriate: true, materialNote: '' };
  }

  const name = FIBER_LABELS[primary];
  const useLabel = profile.label.toLowerCase();
  const isSynthetic = SYNTHETIC.has(primary);

  if (profile.idealFibers.includes(primary)) {
    const materialNote = isSynthetic
      ? `While it's synthetic, this is exactly the right fabric for ${useLabel} — it wicks moisture and dries fast where cotton would stay wet.`
      : `${cap(name)} is well-suited to ${useLabel}.`;
    return { ...base, appropriate: true, materialNote };
  }

  if (profile.poorFibers.includes(primary)) {
    let materialNote: string;
    if (profile.useCase === 'activewear') {
      materialNote = `${cap(name)} holds sweat and dries slowly, so it's a weaker pick for ${useLabel} than a technical synthetic.`;
    } else if (profile.useCase === 'luxury-knit' && isSynthetic) {
      materialNote = `${cap(name)} in fine knitwear pills sooner and lacks the warmth and hand-feel of wool or cashmere.`;
    } else {
      materialNote = `${cap(name)} is a weaker fit for ${useLabel}.`;
    }
    return { ...base, appropriate: false, materialNote };
  }

  return { ...base, appropriate: true, materialNote: `${cap(name)} is a reasonable choice for ${useLabel}.` };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
