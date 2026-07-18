/* AI explanation via Claude. This turns the engine's DETERMINISTIC facts into one
   honest, plain-English paragraph. It never sets the score, picks the verdict, or
   invents a number — every fact it's allowed to use is passed in, already computed
   by the rubric. This is "rules score, AI explains", done transparently.

   Voice matters here: the whole product is about trust, so the output must read
   like a straight-talking human wrote it, not like marketing copy or an AI. */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic();

// Opus 4.8 by default. For high volume, Haiku 4.5 is much cheaper and plenty for
// a task this constrained — set MIQ_EXPLAIN_MODEL=claude-haiku-4-5.
const MODEL = process.env.MIQ_EXPLAIN_MODEL || process.env.MIQ_MODEL || 'claude-opus-4-8';

const SYSTEM = `You are MaterialIQ's explainer. You are given the FACTS a rule-based engine already computed about a clothing product, and you write one short paragraph telling the shopper why it landed where it did.

Hard rules:
- Use ONLY the facts provided. Never introduce a number, price, percentage, or claim that is not in the facts. You do not decide the score or the verdict; they are already decided.
- Plain, direct, second person. Write like a knowledgeable friend who is not trying to sell anything.
- 2 to 3 sentences. Around 45 words, never more than 60.
- No em dashes. No semicolons. No emoji. No exclamation marks.
- Banned words and phrases: elevate, unlock, seamless, dive in, when it comes to, at the end of the day, boasts, crafted, curated, game-changer, in today's world, nestled.
- Do not hedge with "may", "might", "could" when the facts are definite. Say what is true.
- Do not restate the score number back to the user. Explain the why behind it.

Respond ONLY with the JSON object described by the schema.`;

const Explanation = z.object({ explanation: z.string() });

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    explanation: { type: 'string', description: 'One 2-3 sentence plain-English explanation, human voice, only using the given facts' },
  },
  required: ['explanation'],
} as const;

/** The deterministic facts the engine hands the explainer. Everything here is
    already computed by the rubric; the AI only phrases it. */
export interface ExplainFacts {
  title: string;
  useCaseLabel: string;
  verdict: 'worth' | 'fair' | 'skip';
  composition: string;
  materialNote: string;
  brandCaption: string | null;
  factors: { label: string; value: number; max: number }[];
}

export interface ExplainResult {
  explanation: string;
}

export async function explainAnalysis(facts: ExplainFacts): Promise<ExplainResult> {
  const factLines = [
    `Product: ${facts.title}`,
    `Graded as: ${facts.useCaseLabel}`,
    `Verdict: ${facts.verdict}`,
    `Fiber content: ${facts.composition}`,
    facts.materialNote ? `Material fit: ${facts.materialNote}` : '',
    facts.brandCaption ? `Brand premium: ${facts.brandCaption}` : '',
    `Factor scores (out of their max): ${facts.factors.map((f) => `${f.label} ${f.value}/${f.max}`).join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    // Low effort: the task is tightly constrained and the schema fixes the shape.
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Here are the facts:\n\n${factLines}\n\nWrite the explanation.` }],
  });

  if (message.stop_reason === 'refusal') return { explanation: '' }; // degrade honestly
  const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text;
  if (!text) return { explanation: '' };

  const parsed = Explanation.safeParse(JSON.parse(text));
  if (!parsed.success) return { explanation: '' };
  return { explanation: parsed.data.explanation.trim() };
}
