/* MaterialIQ domain types.
   `Product` is what extraction produces from a page.
   `Analysis` is what the rubric engine produces from a Product.
   Everything the UI renders traces back to these — no hidden state. */

export type Fiber =
  | 'organic-cotton'
  | 'cotton'
  | 'combed-cotton'
  | 'pima-cotton'
  | 'linen'
  | 'merino'
  | 'wool'
  | 'cashmere'
  | 'silk'
  | 'modal'
  | 'tencel'
  | 'viscose'
  | 'bamboo'
  | 'polyester'
  | 'recycled-polyester'
  | 'nylon'
  | 'acrylic'
  | 'elastane'
  | 'bonded-leather'
  | 'unknown';

export type YarnType = 'ring-spun' | 'combed' | 'open-end' | 'unknown';

export interface CompositionPart {
  fiber: Fiber;
  /** 0–100. Parts should sum to ~100 when composition is fully known. */
  percent: number;
  /** The raw string we matched, kept for auditability ("100% Ring-Spun Cotton"). */
  raw?: string;
}

export interface ReviewSummary {
  count: number;
  /** Plain-English pros. This is the ONE place AI is used (summarization). */
  pros: string[];
  cons: string[];
  /** 0–5 durability signal derived from review content, if available. */
  durabilitySignal?: number;
}

export interface Product {
  title: string;
  retailer: string; // hostname, e.g. "www.uniqlo.com"
  url: string;
  price: number | null;
  currency: string;
  category: 'tshirt' | 'knit' | 'unknown';
  composition: CompositionPart[];
  gsm: number | null;
  yarn: YarnType;
  origin: string | null;
  /** Free-text construction cues found on the page ("double-stitched", "linked seams"). */
  constructionSignals: string[];
  reviews?: ReviewSummary;
  /** Confidence in the extraction itself, 0–1. Low confidence → UI hedges. */
  extractionConfidence: number;
  /** Human-readable notes about what could NOT be extracted. */
  notes: string[];
}

export type Verdict = 'worth' | 'fair' | 'skip';

/** The garment's use-case — richer than `Product.category`. Determines which
    scoring profile (fiber adjustments, weights, price model) the engine applies,
    so the same fiber is judged by what the garment is FOR. */
export type UseCase =
  | 'everyday-tee'
  | 'activewear'
  | 'luxury-knit'
  | 'everyday-knit'
  | 'unknown';

/** Plain-English framing of how the garment was judged, surfaced in the UI.
    `materialNote` is the "while synthetic, it's the right fabric here" line. */
export interface CategoryContext {
  useCase: UseCase;
  /** Short display label, e.g. "Activewear". */
  label: string;
  /** One line on what this use-case is graded for. */
  blurb: string;
  /** Whether the primary material suits this use-case — drives copy + UI tone. */
  appropriate: boolean;
  /** The material-fit explanation, generated deterministically from the profile. */
  materialNote: string;
  /** True when the use-case was chosen by AI rather than the rule classifier.
      Rules today; the AI layer sets this so the UI can label it. */
  aiClassified: boolean;
}

export interface FactorScore {
  key: string;
  label: string;
  /** Score on this factor's own scale. */
  value: number;
  max: number;
  detail: string;
  /** True when this factor was estimated rather than read from the page. */
  estimated: boolean;
}

export interface Comparable {
  name: string;
  retailer: string;
  price: number;
  qualityScore: number;
  url: string;
}

/** An alternative option bubbled up to the UI. */
export interface BetterOption {
  name: string;
  retailer: string;
  price: number;
  qualityScore: number;
  reason: string;
  url: string;
}

/** "Are you buying the product or the brand?" — the share of the asking price
    that isn't explained by material and construction. */
export interface BrandPremium {
  /** What a no-name maker of the same substance would charge, in dollars. */
  substancePrice: number;
  askingPrice: number;
  /** (asking - substance) / substance. Negative means priced below its substance. */
  premiumPct: number;
  /** asking - substance, in dollars. Negative when it's a genuine deal. */
  premiumDollars: number;
  /** 0–1 portion of the asking price that is substance (for the split bar). */
  substanceShare: number;
  tier: 'deal' | 'low' | 'moderate' | 'high' | 'extreme';
  /** Short display label, e.g. "High brand premium". */
  label: string;
  /** One plain-English sentence. Human voice, no jargon. */
  caption: string;
}

/** Price reframed around use, not sticker. */
export interface CostPerWear {
  perWear: number; // dollars per wear
  wears: number; // estimated lifetime wears
  years: number; // estimated lifespan
}

export interface Analysis {
  product: Product;
  /** The headline "Worth the price?" number, 0–10. */
  overall: number;
  verdict: Verdict;
  /** The use-case the garment was scored as. */
  useCase: UseCase;
  /** How the use-case shaped the grade, for display. */
  categoryContext: CategoryContext;
  qualityScore: number;
  valueScore: number;
  factors: FactorScore[];
  /** Expected-lifespan stars, 0–5, with a plain caption ("3–5 yrs"). */
  durabilityStars: number;
  durabilityCaption: string;
  /** Consumer-advocate one-liner. Rule-generated, deterministic. */
  verdictCopy: string;
  /** A cheaper comparable of similar quality, when one beats this on value. */
  alternative: Comparable | null;
  /** Up to a few cross-retailer options that beat this product on value. */
  betterOptions: BetterOption[];
  /** Price per wear, when a price is known. */
  costPerWear: CostPerWear | null;
  /** Brand premium — product vs brand, when a price and use-case are known. */
  brandPremium: BrandPremium | null;
  /** Material red-flags and care instructions based on composition. */
  careAndFlags: { text: string; type: 'warning' | 'info' }[];
  /** Rubric version the score was computed under — printed in the UI for auditability. */
  rubricVersion: string;
  analyzedMs: number;
}
