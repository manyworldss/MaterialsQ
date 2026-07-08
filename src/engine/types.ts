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
}

export interface Analysis {
  product: Product;
  /** The headline "Worth the price?" number, 0–10. */
  overall: number;
  verdict: Verdict;
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
  /** Rubric version the score was computed under — printed in the UI for auditability. */
  rubricVersion: string;
  analyzedMs: number;
}
