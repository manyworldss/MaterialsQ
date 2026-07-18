/* Calls the MaterialIQ backend to turn the engine's deterministic facts into one
   plain-English paragraph. Gated behind the aiExplanations setting (OFF until the
   backend is live), and returns null on any failure — the explanation is an
   enhancement layered on top of the rule-based verdict, never a blocker. The
   score and verdict are ALWAYS the engine's; the AI only phrases the "why". */

import type { Analysis } from '../engine/types';
import { FIBER_LABELS } from '../engine/rubric';
import { BACKEND_URL } from './config';
import { getSettings } from './settings';

/** Distill an Analysis into the facts the explainer is allowed to use. Only
    rubric-computed values go here — nothing the AI could turn into a new claim. */
export function factsFrom(analysis: Analysis) {
  const p = analysis.product;
  const composition = p.composition.length
    ? p.composition
        .filter((c) => c.percent > 0)
        .sort((a, b) => b.percent - a.percent)
        .map((c) => `${Math.round(c.percent)}% ${FIBER_LABELS[c.fiber]}`)
        .join(', ')
    : 'not listed';
  return {
    title: p.title,
    useCaseLabel: analysis.categoryContext.label,
    verdict: analysis.verdict,
    composition,
    materialNote: analysis.categoryContext.materialNote,
    brandCaption: analysis.brandPremium?.caption ?? null,
    factors: analysis.factors.map((f) => ({ label: f.label, value: f.value, max: f.max })),
  };
}

/** Fetch the AI explanation for an analysis, or null. Respects the setting and
    fails silently so the extension works with or without the backend. */
export async function fetchExplanation(analysis: Analysis): Promise<string | null> {
  const settings = await getSettings();
  if (!settings.aiExplanations) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/explain`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ facts: factsFrom(analysis), url: analysis.product.url }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { explanation?: string };
    const text = data.explanation?.trim();
    return text ? text : null;
  } catch {
    return null; // backend down, timeout, CORS, rate-limited — degrade gracefully
  } finally {
    clearTimeout(timeout);
  }
}
