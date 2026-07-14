/* Calls the MaterialIQ backend to summarize scraped reviews. Returns a
   ReviewSummary the engine can fold into durability, or null on any failure —
   reviews are an enhancement, never a blocker. */

import type { ReviewSummary } from '../engine/types';
import { BACKEND_URL } from './config';

export async function fetchReviewSummary(title: string, reviews: string[], url?: string): Promise<ReviewSummary | null> {
  if (reviews.length === 0) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // url lets the backend cache by product identity (reused across users).
      body: JSON.stringify({ title, reviews, url }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { count: number; pros: string[]; cons: string[]; durabilitySignal: number };
    return {
      count: data.count,
      pros: data.pros ?? [],
      cons: data.cons ?? [],
      durabilitySignal: data.durabilitySignal,
    };
  } catch {
    return null; // backend down, timeout, CORS — degrade gracefully
  } finally {
    clearTimeout(timeout);
  }
}
