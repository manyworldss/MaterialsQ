import { describe, expect, it } from 'vitest';
import { analyze } from './score';
import { SAMPLE_TEE, SAMPLE_KNIT, SAMPLE_BAD_TEE } from './samples';

describe('rubric engine', () => {
  it('rates a well-made, fairly-priced cotton tee as worth it', () => {
    const a = analyze(SAMPLE_TEE);
    expect(a.verdict).toBe('worth');
    expect(a.overall).toBeGreaterThanOrEqual(7.5);
    expect(a.factors.find((f) => f.key === 'materials')!.value).toBeGreaterThan(8);
  });

  it('rates an overpriced poly/cotton fast-fashion tee as skip', () => {
    const a = analyze(SAMPLE_BAD_TEE);
    expect(a.verdict).toBe('skip');
    expect(a.alternative).not.toBeNull();
  });

  it('handles missing GSM by redistributing weight, not crashing', () => {
    const a = analyze(SAMPLE_KNIT);
    expect(a.factors.some((f) => f.key === 'fabricWeight')).toBe(false);
    expect(Number.isFinite(a.overall)).toBe(true);
  });

  it('is deterministic', () => {
    expect(analyze(SAMPLE_TEE).overall).toBe(analyze(SAMPLE_TEE).overall);
  });

  it('scores are bounded 0–10', () => {
    for (const p of [SAMPLE_TEE, SAMPLE_KNIT, SAMPLE_BAD_TEE]) {
      const a = analyze(p);
      expect(a.overall).toBeGreaterThanOrEqual(0);
      expect(a.overall).toBeLessThanOrEqual(10);
    }
  });
});
