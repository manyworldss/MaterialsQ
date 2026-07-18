/* Smoke test for review summarization. Runs the real Claude call against sample
   reviews and prints the structured result. Verifies your key + model work
   end-to-end without needing the extension or a live retailer page.

   Usage:  cd server && cp .env.example .env  (add your key)  && npm run smoke   */

import 'dotenv/config';
import { summarizeReviews } from './summarize.js';
import { explainAnalysis } from './explain.js';

const SAMPLE_REVIEWS = [
  'Great everyday tee. The fabric is thick and holds its shape even after a dozen washes.',
  'Runs slightly large but the cotton is soft and does not pill like cheaper shirts.',
  'The collar stretched out a bit after I hung it wet to dry. Otherwise solid.',
  'Best basic tee I own. Double-stitched seams, no fraying after months of wear.',
  'Color faded a little after the first wash but nothing dramatic. Still recommend.',
];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set. Add it to server/.env (see .env.example) and retry.');
    process.exit(1);
  }
  console.log(`Model: ${process.env.MIQ_MODEL || 'claude-opus-4-8'}`);
  console.log('Summarizing 5 sample reviews…\n');
  const t0 = Date.now();
  const result = await summarizeReviews('AIRism Cotton Crew Neck T-Shirt', SAMPLE_REVIEWS);
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n✓ Summarize done in ${Date.now() - t0}ms.`);

  // Exercise the explanation path on deterministic facts (mirrors what the
  // extension sends). Verifies the plain-voice output end-to-end.
  console.log('\nExplaining a sample verdict…\n');
  const t1 = Date.now();
  const explain = await explainAnalysis({
    title: 'Ultra Performance Running Tee',
    useCaseLabel: 'Activewear',
    verdict: 'worth',
    composition: '88% polyester, 12% elastane',
    materialNote: "While it's synthetic, this is exactly the right fabric for activewear.",
    brandCaption: 'About $9 of the $35 is brand premium. The rest is the garment itself.',
    factors: [
      { label: 'Materials', value: 8.4, max: 10 },
      { label: 'Construction', value: 7.5, max: 10 },
      { label: 'Value', value: 7.9, max: 10 },
    ],
  });
  console.log(JSON.stringify(explain, null, 2));
  console.log(`\n✓ Explain done in ${Date.now() - t1}ms.`);
}

main().catch((err) => {
  console.error('✗ Smoke test failed:', err?.message ?? err);
  process.exit(1);
});
