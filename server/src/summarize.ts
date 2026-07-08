/* Review summarization via Claude. This is the ONLY place MaterialIQ uses AI —
   it summarizes review text into structured pros/cons + a durability signal.
   It NEVER produces the score; the rubric engine does that from hard data.

   We constrain the response with output_config.format (JSON schema) so the model
   returns valid, parseable JSON, then validate with zod before trusting it. */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Reads ANTHROPIC_API_KEY from the environment. Never ships to the client.
const client = new Anthropic();

// Default to Opus 4.8. For high-volume production, Haiku 4.5 is dramatically
// cheaper for a task this simple — set MIQ_MODEL=claude-haiku-4-5 to switch.
const MODEL = process.env.MIQ_MODEL || 'claude-opus-4-8';

const SYSTEM = `You are MaterialIQ's review analyst. You read customer reviews of a clothing product and summarize them for a shopper deciding whether to buy.

Voice: consumer advocate. Confident, plain-English, specific. Second person, contractions, sentence case.
Rules:
- Be precise and sourced. Prefer "Collar stretches after ~10 washes, per multiple reviews" over "some users had issues."
- Pros and cons must be about the PRODUCT (fabric, fit, durability, construction), not shipping or customer service.
- Max 3 pros and 3 cons. Omit a category entirely if the reviews don't support it.
- No emoji. No marketing language. No exclamation marks unless a genuine safety warning.
- durabilitySignal: your best 0-5 estimate of real-world longevity based ONLY on what reviews say about wear, pilling, shrinkage, seams, and shape retention. 5 = holds up for years; 1 = falls apart fast. If reviews say nothing about durability, use 3.

Respond ONLY with the JSON object described by the schema.`;

const ReviewSummary = z.object({
  pros: z.array(z.string()).max(3),
  cons: z.array(z.string()).max(3),
  durabilitySignal: z.number().min(0).max(5),
});

// JSON schema the API enforces on the output (structured outputs).
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    pros: { type: 'array', items: { type: 'string' }, description: 'Up to 3 product-specific positives in advocate voice' },
    cons: { type: 'array', items: { type: 'string' }, description: 'Up to 3 product-specific negatives; empty if none' },
    durabilitySignal: { type: 'number', description: '0-5 real-world durability estimate from review content' },
  },
  required: ['pros', 'cons', 'durabilitySignal'],
} as const;

export type ReviewSummaryResult = z.infer<typeof ReviewSummary> & { count: number };

export async function summarizeReviews(title: string, reviews: string[]): Promise<ReviewSummaryResult> {
  // Bound the input: cap review count and total characters to control cost/latency.
  const sample = reviews
    .map((r) => r.replace(/\s+/g, ' ').trim())
    .filter((r) => r.length > 8)
    .slice(0, 200);
  const joined = sample.join('\n---\n').slice(0, 40_000);
  const empty: ReviewSummaryResult = { count: sample.length, pros: [], cons: [], durabilitySignal: 3 };

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    // effort:low — simple, high-volume task; the format guarantees the shape.
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Product: ${title}\n\nCustomer reviews:\n${joined}` }],
  });

  if (message.stop_reason === 'refusal') return empty; // classifier declined — degrade honestly
  const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text;
  if (!text) return empty;

  const parsed = ReviewSummary.safeParse(JSON.parse(text));
  if (!parsed.success) return empty;
  return { ...parsed.data, count: sample.length };
}
