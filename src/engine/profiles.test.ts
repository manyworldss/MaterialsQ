import { describe, expect, it } from 'vitest';
import { analyze } from './score';
import { detectUseCase, effectiveFiberScore, profileFor } from './profiles';
import { SAMPLE_TEE, SAMPLE_KNIT, SAMPLE_ACTIVEWEAR, SAMPLE_BAD_TEE } from './samples';
import type { Product } from './types';

describe('use-case classification', () => {
  it('classifies a synthetic performance tee as activewear', () => {
    expect(detectUseCase(SAMPLE_ACTIVEWEAR)).toBe('activewear');
  });

  it('does NOT mis-classify a cotton "AIRism" tee as activewear', () => {
    // The guard: fabric-tech branding on a natural-fiber lifestyle tee must not
    // trigger the activewear profile (which would wrongly penalize the cotton).
    expect(detectUseCase(SAMPLE_TEE)).toBe('everyday-tee');
  });

  it('classifies a merino sweater as fine knitwear', () => {
    expect(detectUseCase(SAMPLE_KNIT)).toBe('luxury-knit');
  });

  it('treats unambiguous product types as activewear regardless of fiber', () => {
    const cottonCompression: Product = {
      ...SAMPLE_TEE,
      title: 'Compression Base Layer',
      composition: [{ fiber: 'cotton', percent: 95 }, { fiber: 'elastane', percent: 5 }],
    };
    expect(detectUseCase(cottonCompression)).toBe('activewear');
  });

  it('demotes an acrylic sweater to a poor luxury-knit fit', () => {
    const acrylicSweater: Product = {
      ...SAMPLE_KNIT,
      title: 'Chunky Knit Sweater',
      composition: [{ fiber: 'acrylic', percent: 100 }],
    };
    expect(detectUseCase(acrylicSweater)).toBe('everyday-knit');
    const ctx = analyze(acrylicSweater).categoryContext;
    expect(ctx.appropriate).toBe(false);
  });
});

describe('use-case-adjusted fiber scores', () => {
  it('scores polyester higher for activewear than for an everyday tee', () => {
    const active = effectiveFiberScore('polyester', profileFor('activewear'));
    const tee = effectiveFiberScore('polyester', profileFor('everyday-tee'));
    expect(active).toBeGreaterThan(tee);
    expect(active).toBeGreaterThanOrEqual(8);
  });

  it('scores acrylic lower for fine knitwear than baseline', () => {
    const knit = effectiveFiberScore('acrylic', profileFor('luxury-knit'));
    const baseline = effectiveFiberScore('acrylic', profileFor('unknown'));
    expect(knit).toBeLessThan(baseline);
  });

  it('never leaves the 0..10 range', () => {
    for (const uc of ['everyday-tee', 'activewear', 'luxury-knit', 'everyday-knit', 'unknown'] as const) {
      const p = profileFor(uc);
      for (const f of Object.keys(p.fiberAdjust) as (keyof typeof p.fiberAdjust)[]) {
        const v = effectiveFiberScore(f, p);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('same fabric, different verdict (the Objective-2 payoff)', () => {
  it('rates identical poly/elastane fabric well for activewear, poorly for an everyday tee', () => {
    const asActive = analyze(SAMPLE_ACTIVEWEAR);
    // Same composition, but a generic title → everyday-tee profile.
    const asGenericTee = analyze({ ...SAMPLE_ACTIVEWEAR, title: 'Basic Logo Tee' });

    expect(asActive.useCase).toBe('activewear');
    expect(asGenericTee.useCase).toBe('everyday-tee');

    const activeMaterials = asActive.factors.find((f) => f.key === 'materials')!.value;
    const teeMaterials = asGenericTee.factors.find((f) => f.key === 'materials')!.value;

    expect(activeMaterials).toBeGreaterThan(teeMaterials + 2);
    expect(activeMaterials).toBeGreaterThan(7.5);
    expect(asActive.categoryContext.appropriate).toBe(true);
    expect(asActive.categoryContext.materialNote.toLowerCase()).toContain('synthetic');
  });

  it('drops GSM from the quality composite for activewear', () => {
    const a = analyze(SAMPLE_ACTIVEWEAR); // has gsm: 140
    expect(a.factors.some((f) => f.key === 'fabricWeight')).toBe(false);
  });
});

describe('brand premium (product vs brand)', () => {
  it('flags a heavy brand premium on an overpriced fast-fashion logo tee', () => {
    const bp = analyze(SAMPLE_BAD_TEE).brandPremium; // $45 poly/cotton tee
    expect(bp).not.toBeNull();
    expect(bp!.premiumPct).toBeGreaterThan(0.75);
    expect(['high', 'extreme']).toContain(bp!.tier);
  });

  it('rates honest merino as mostly substance, not brand', () => {
    const bp = analyze(SAMPLE_KNIT).brandPremium; // $95 merino crew
    expect(bp).not.toBeNull();
    expect(bp!.premiumPct).toBeLessThan(analyze(SAMPLE_BAD_TEE).brandPremium!.premiumPct);
    expect(['deal', 'low', 'moderate']).toContain(bp!.tier);
  });

  it('splits the asking price into substance + brand that add up', () => {
    const bp = analyze(SAMPLE_BAD_TEE).brandPremium!;
    expect(bp.substancePrice + bp.premiumDollars).toBeCloseTo(bp.askingPrice, 1);
    expect(bp.substanceShare).toBeGreaterThanOrEqual(0);
    expect(bp.substanceShare).toBeLessThanOrEqual(1);
    expect(bp.caption.length).toBeGreaterThan(0);
    expect(bp.caption).not.toContain('—'); // human voice, no em dashes
  });

  it('is null when there is no price', () => {
    expect(analyze({ ...SAMPLE_BAD_TEE, price: null }).brandPremium).toBeNull();
  });
});

describe('category context is always well-formed', () => {
  it('exposes a useCase, label, and blurb on every analysis', () => {
    for (const p of [SAMPLE_TEE, SAMPLE_KNIT, SAMPLE_ACTIVEWEAR, SAMPLE_BAD_TEE]) {
      const a = analyze(p);
      expect(a.categoryContext.useCase).toBe(a.useCase);
      expect(a.categoryContext.label.length).toBeGreaterThan(0);
      expect(a.categoryContext.blurb.length).toBeGreaterThan(0);
      expect(a.categoryContext.aiClassified).toBe(false);
    }
  });
});
