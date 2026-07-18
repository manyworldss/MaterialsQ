/* The rubric engine. Pure function: Product in, Analysis out. No I/O, no DOM,
   no AI. Deterministic and unit-testable — this is what makes a score reproducible. */

import type { Analysis, FactorScore, Product, Verdict } from './types';
import {
  CONSTRUCTION_CUES,
  FIBER_LABELS,
  OVERALL_WEIGHTS,
  RUBRIC_VERSION,
  VERDICT_THRESHOLDS,
  YARN_BONUS,
  gsmScore,
} from './rubric';
import {
  buildCategoryContext,
  detectUseCase,
  effectiveFiberScore,
  profileFor,
  type ScoringProfile,
} from './profiles';
import { betterOptions, findAlternative, marketReference } from './comparables';

function computeCostPerWear(product: Product, stars: number, profile: ScoringProfile) {
  if (product.price == null || product.price <= 0) return null;
  const years = stars >= 4.2 ? 5 : stars >= 3.2 ? 4 : stars >= 2.2 ? 2 : 1;
  const wears = Math.max(1, Math.round(years * profile.wearsPerYear));
  return { perWear: product.price / wears, wears, years };
}

/* ---- Brand premium: product vs brand ---- */

function computeBrandPremium(product: Product, qualityScore: number, profile: ScoringProfile) {
  // Needs a price, and a use-case we can price a substance floor for.
  if (product.price == null || product.price <= 0 || profile.useCase === 'unknown') return null;
  const asking = product.price;
  const substance = Math.max(1, round1(profile.substancePrice.base + profile.substancePrice.perPoint * qualityScore));
  const premiumDollars = asking - substance;
  const premiumPct = premiumDollars / substance;
  const substanceShare = clamp(substance / asking, 0, 1);

  let tier: 'deal' | 'low' | 'moderate' | 'high' | 'extreme';
  let label: string;
  if (premiumPct < 0) {
    tier = 'deal';
    label = 'Priced below its substance';
  } else if (premiumPct < 0.25) {
    tier = 'low';
    label = 'Mostly substance';
  } else if (premiumPct < 0.75) {
    tier = 'moderate';
    label = 'Some brand premium';
  } else if (premiumPct < 1.5) {
    tier = 'high';
    label = 'High brand premium';
  } else {
    tier = 'extreme';
    label = 'Mostly the label';
  }

  const dol = Math.round(Math.abs(premiumDollars));
  const ask = Math.round(asking);
  let caption: string;
  switch (tier) {
    case 'deal':
      caption = `The materials and make are worth more than the asking price. That is rare.`;
      break;
    case 'low':
      caption = `Almost all of this price is the garment. Only about $${dol} is the brand.`;
      break;
    case 'moderate':
      caption = `About $${dol} of the $${ask} is brand premium. The rest is the garment itself.`;
      break;
    case 'high':
      caption = `Roughly $${dol} of this price is the name, not the garment.`;
      break;
    default:
      caption = `You are mostly paying for the label. About $${dol} of $${ask} is brand tax.`;
  }

  return { substancePrice: substance, askingPrice: asking, premiumPct, premiumDollars, substanceShare, tier, label, caption };
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/* ---- Individual factor scorers ---- */

function scoreMaterials(product: Product, profile: ScoringProfile): FactorScore {
  const parts = product.composition.filter((p) => p.percent > 0);
  if (!parts.length) {
    return { key: 'materials', label: 'Materials', value: 5, max: 10, detail: 'Fiber content not listed on the page', estimated: true };
  }
  const total = parts.reduce((s, p) => s + p.percent, 0) || 100;
  // Use-case-adjusted fiber scores: polyester is graded up for activewear, down
  // for fine knitwear, etc. Same fibers, judged by what the garment is for.
  const weighted = parts.reduce((s, p) => s + effectiveFiberScore(p.fiber, profile) * (p.percent / total), 0);
  const detail = parts
    .sort((a, b) => b.percent - a.percent)
    .map((p) => `${Math.round(p.percent)}% ${FIBER_LABELS[p.fiber]}`)
    .join(', ');
  const estimated = parts.some((p) => p.fiber === 'unknown');
  return { key: 'materials', label: 'Materials', value: round1(clamp(weighted)), max: 10, detail, estimated };
}

function scoreFabricWeight(product: Product, profile: ScoringProfile): FactorScore | null {
  // GSM is only a quality signal where fabric weight tracks quality (everyday tees).
  // For knits and performance wear it's noise, so it's dropped and its weight is
  // redistributed onto materials + construction.
  if (product.gsm == null || !profile.gsmMeaningful) return null;
  const { score, label } = gsmScore(product.gsm);
  return { key: 'fabricWeight', label: 'Fabric weight', value: round1(score / 2), max: 5, detail: `${product.gsm} GSM · ${label}`, estimated: false };
}

function scoreConstruction(product: Product): FactorScore {
  const yarn = YARN_BONUS[product.yarn];
  const cues = CONSTRUCTION_CUES.filter((c) => product.constructionSignals.some((s) => c.pattern.test(s)));
  let value = 6.5 + yarn.bonus + cues.reduce((s, c) => s + c.bonus, 0);
  value = clamp(value);
  const bits: string[] = [];
  if (yarn.label) bits.push(yarn.label);
  cues.forEach((c) => bits.push(c.label));
  const estimated = product.yarn === 'unknown' && cues.length === 0;
  const detail = bits.length ? bits.join('; ') : 'No construction details on the page, estimated from fiber';
  return { key: 'construction', label: 'Construction', value: round1(value), max: 10, detail, estimated };
}

/* ---- Value ---- */

function computeValue(product: Product, qualityScore: number, profile: ScoringProfile): { factor: FactorScore; reference: number | null; discountPct: number } {
  if (product.price == null || product.price <= 0) {
    return {
      factor: { key: 'value', label: 'Value', value: 5, max: 10, detail: 'No price found on the page', estimated: true },
      reference: null,
      discountPct: 0,
    };
  }
  const market = marketReference(profile.comparableCategory, qualityScore);
  const modelPrice = profile.price.base + profile.price.perPoint * qualityScore;
  // Reference = the fair-price-for-quality model, averaged with same-quality
  // market comparables when we have them. Both signals, neither alone.
  const reference = market != null ? (modelPrice + market) / 2 : modelPrice;
  const discountPct = (reference - product.price) / reference; // >0 means cheaper than reference

  // Transparent value model: start neutral (5), reward paying under reference,
  // nudge by absolute quality. Documented in the methodology page.
  const value = clamp(5 + discountPct * 22 + (qualityScore - 6) * 0.3);
  const cmp =
    market != null
      ? `Comparable ${profile.comparableCategory === 'knit' ? 'knits' : 'tees'} run around $${market.toFixed(0)}`
      : `Fair price for this quality is about $${modelPrice.toFixed(0)}`;
  const pctTxt =
    discountPct >= 0.03
      ? `${Math.round(discountPct * 100)}% under comparable products`
      : discountPct <= -0.03
        ? `${Math.round(-discountPct * 100)}% over comparable products`
        : 'priced in line with comparable products';
  return {
    factor: { key: 'value', label: 'Value', value: round1(value), max: 10, detail: `${pctTxt}. ${cmp}.`, estimated: market == null },
    reference,
    discountPct,
  };
}

/* ---- Durability (stars) ---- */

function computeDurability(product: Product, construction: FactorScore, materials: FactorScore): { stars: number; caption: string } {
  const reviewSignal = product.reviews?.durabilitySignal;
  const base = (construction.value * 0.6 + materials.value * 0.4) / 2; // → 0–5
  const stars = round1(clamp(reviewSignal != null ? reviewSignal * 0.6 + base * 0.4 : base, 0, 5));
  const caption = stars >= 4.2 ? '5+ yrs' : stars >= 3.2 ? '3–5 yrs' : stars >= 2.2 ? '1–3 yrs' : '< 1 yr';
  return { stars, caption };
}

/* ---- Verdict + advocate copy ---- */

function decideVerdict(overall: number, valueScore: number): Verdict {
  if (valueScore < 3.2) return 'skip'; // overpriced regardless of quality
  if (overall >= VERDICT_THRESHOLDS.worth) return 'worth';
  if (overall < VERDICT_THRESHOLDS.skip) return 'skip';
  return 'fair';
}

function writeCopy(
  product: Product,
  verdict: Verdict,
  materials: FactorScore,
  value: FactorScore,
  discountPct: number,
): string {
  const priceTxt = product.price != null ? `$${product.price.toFixed(2)}` : 'this price';
  const primary = [...product.composition].sort((a, b) => b.percent - a.percent)[0];
  const fiberTxt = primary ? FIBER_LABELS[primary.fiber] : 'the fabric';
  if (verdict === 'worth') {
    if (discountPct >= 0.1) return `Genuine ${fiberTxt} for ${Math.round(discountPct * 100)}% less than comparable products. At ${priceTxt}, buy it.`;
    return `Solid ${fiberTxt} and honest construction at a fair price. At ${priceTxt}, it's worth it.`;
  }
  if (verdict === 'skip') {
    if (value.value < 3.5) return `You're paying for the label, not the cloth. At ${priceTxt}, skip this one.`;
    if (materials.value <= 4) return `Cheap fibers that'll pill and fade fast. Skip this one.`;
    return `Nothing here justifies ${priceTxt}. Skip it. The alternative below is the smarter buy.`;
  }
  return `Fine, not special. ${fiberTxt} at ${priceTxt} is about what you'd expect. No bargain, no rip-off.`;
}

/* ---- Red Flags & Care Tips ---- */

function computeFlags(product: Product): { text: string; type: 'warning' | 'info' }[] {
  const flags: { text: string; type: 'warning' | 'info' }[] = [];
  const p = product.composition.reduce((acc, curr) => {
    acc[curr.fiber] = (acc[curr.fiber] || 0) + curr.percent;
    return acc;
  }, {} as Record<string, number>);

  if ((p['acrylic'] ?? 0) > 15) {
    flags.push({ text: 'High pilling risk: acrylic sheds and pills quickly', type: 'warning' });
  }
  if ((p['polyester'] ?? 0) > 40) {
    flags.push({ text: 'Low breathability, retains odors', type: 'warning' });
  }
  if ((p['viscose'] ?? 0) > 0 || (p['rayon'] ?? 0) > 0) {
    flags.push({ text: 'Prone to shrinking and losing shape if washed hot', type: 'warning' });
  }
  if ((p['silk'] ?? 0) > 0 || (p['cashmere'] ?? 0) > 0) {
    flags.push({ text: 'Requires dry cleaning or careful hand-washing', type: 'info' });
  }
  if ((p['linen'] ?? 0) > 0) {
    flags.push({ text: 'Prone to heavy wrinkling', type: 'info' });
  }
  return flags;
}

/* ---- Compose ---- */

export function analyze(product: Product): Analysis {
  const t0 = performance.now();
  // Classify the use-case first, then grade the garment by what it's FOR.
  const useCase = detectUseCase(product);
  const profile = profileFor(useCase);

  const materials = scoreMaterials(product, profile);
  const fabricWeight = scoreFabricWeight(product, profile);
  const construction = scoreConstruction(product);

  // Quality composite. Redistribute the fabric-weight weight when GSM is missing
  // or not meaningful for this use-case.
  const w = profile.weights;
  let qualityScore: number;
  if (fabricWeight) {
    qualityScore =
      materials.value * w.materials + construction.value * w.construction + (fabricWeight.value / 5) * 10 * w.fabricWeight;
  } else {
    const scale = 1 / (w.materials + w.construction);
    qualityScore = materials.value * w.materials * scale + construction.value * w.construction * scale;
  }
  qualityScore = round1(clamp(qualityScore));

  const { factor: value, discountPct } = computeValue(product, qualityScore, profile);
  const overall = round1(clamp(qualityScore * OVERALL_WEIGHTS.quality + value.value * OVERALL_WEIGHTS.value));
  const verdict = decideVerdict(overall, value.value);
  const { stars, caption } = computeDurability(product, construction, materials);
  const verdictCopy = writeCopy(product, verdict, materials, value, discountPct);
  const alternative = verdict === 'worth' ? null : findAlternative(profile.comparableCategory, qualityScore, product.price);
  const options = betterOptions(profile.comparableCategory, qualityScore, product.price, product.title);
  const costPerWear = computeCostPerWear(product, stars, profile);
  const brandPremium = computeBrandPremium(product, qualityScore, profile);
  const careAndFlags = computeFlags(product);
  const categoryContext = buildCategoryContext(product, profile);

  const factors: FactorScore[] = [materials, ...(fabricWeight ? [fabricWeight] : []), construction, value];

  return {
    product,
    overall,
    verdict,
    useCase,
    categoryContext,
    qualityScore,
    valueScore: value.value,
    factors,
    durabilityStars: stars,
    durabilityCaption: caption,
    verdictCopy,
    alternative,
    betterOptions: options,
    costPerWear,
    brandPremium,
    careAndFlags,
    rubricVersion: RUBRIC_VERSION,
    analyzedMs: Math.max(1, Math.round(performance.now() - t0)),
  };
}
