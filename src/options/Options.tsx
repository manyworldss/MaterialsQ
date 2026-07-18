import { useEffect, useState } from 'react';
import { Badge, Card, Switch } from '../design-system/core';
import { ScoreBar } from '../design-system/scores';
import { FIBER_LABELS, FIBER_SCORES, RUBRIC_VERSION, gsmScore } from '../engine/rubric';
import { PROFILES } from '../engine/profiles';
import type { Fiber, UseCase } from '../engine/types';
import { DEFAULT_SETTINGS, getSettings, setSettings, type Settings } from '../lib/settings';

const NAV = [
  ['Extension', ['Settings']],
  ['Methodology', ['How we score', 'Use-case scoring', 'Brand premium', 'Material scores', 'Fabric weight (GSM)']],
] as const;

/* Which use-cases to document, in reading order. `unknown` is the neutral
   baseline (no adjustments) and is described in prose instead. */
const DOC_USE_CASES: UseCase[] = ['everyday-tee', 'activewear', 'luxury-knit', 'everyday-knit'];

const pct = (n: number) => `${Math.round(n * 100)}%`;

function formatWeights(p: (typeof PROFILES)[UseCase]): string {
  const w = p.weights;
  if (p.gsmMeaningful) {
    return `${pct(w.materials)} materials · ${pct(w.construction)} construction · ${pct(w.fabricWeight)} fabric weight`;
  }
  const s = w.materials + w.construction;
  return `${pct(w.materials / s)} materials · ${pct(w.construction / s)} construction · GSM not used`;
}

/* Material table rendered straight from the engine's constants — the docs can
   never disagree with the code. */
const MATERIAL_ROWS = (Object.keys(FIBER_SCORES) as Fiber[])
  .filter((f) => f !== 'unknown' && f !== 'elastane')
  .map((f) => [FIBER_LABELS[f], FIBER_SCORES[f]] as const)
  .sort((a, b) => b[1] - a[1]);

const GSM_BANDS = [110, 145, 170, 200, 240, 280];

function Wordmark({ sub }: { sub?: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontStretch: '125%', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
      Material<span style={{ color: 'var(--accent)' }}>IQ</span>
      {sub && <span style={{ fontFamily: 'var(--font-sans)', fontStretch: '100%', fontWeight: 500, color: 'var(--fg-3)', fontSize: 12, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>{sub}</span>}
    </span>
  );
}

export function Options() {
  const [active, setActive] = useState('Settings');
  const [settings, setLocal] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettings().then(setLocal);
    if (location.hash.replace('#', '') === 'methodology') setActive('How we score');
  }, []);

  const update = (patch: Partial<Settings>) => {
    setLocal((s) => ({ ...s, ...patch }));
    setSettings(patch);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid var(--border-1)', background: 'var(--bg-1)', padding: '20px 16px' }}>
        <div style={{ padding: '0 10px 18px' }}>
          <Wordmark sub="Docs" />
        </div>
        {NAV.map(([group, items]) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)', padding: '0 10px 6px' }}>{group}</div>
            <div style={{ display: 'grid', gap: 1 }}>
              {items.map((it) => (
                <button
                  key={it}
                  onClick={() => setActive(it)}
                  style={{
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: active === it ? 'var(--accent-tint)' : 'transparent',
                    color: active === it ? 'var(--accent-bright)' : 'var(--fg-2)',
                    fontWeight: active === it ? 600 : 400,
                    transition: 'var(--transition-ui)',
                  }}
                >
                  {it}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Content */}
      <main style={{ padding: '40px 56px', maxWidth: 760 }}>
        {active === 'Settings' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Extension
            </Badge>
            <h1 style={{ margin: '0 0 24px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Settings</h1>
            <Card padding="4px 20px">
              <SettingRow
                title="Show the inline badge"
                desc="Inject the MaterialIQ pill next to the price on supported product pages."
                control={<Switch checked={settings.showInlineBadge} onChange={(v) => update({ showInlineBadge: v })} />}
              />
              <SettingRow
                title="Suggest cheaper alternatives"
                desc="When a product isn't worth it, show a similar-quality item that costs less."
                control={<Switch checked={settings.showAlternatives} onChange={(v) => update({ showAlternatives: v })} />}
              />
              <SettingRow
                title="AI review summaries (beta)"
                desc="Summarize what real owners report about fit, durability, and wear. Rolling out at launch. Scoring stays fully local and rule-based either way."
                control={<Switch checked={settings.reviewSummaries} onChange={(v) => update({ reviewSummaries: v })} />}
              />
              <SettingRow
                title="AI explanation (beta)"
                desc="Add one plain-English paragraph explaining the verdict. The AI only phrases the numbers the rules already computed. It never sets the score. Off until launch."
                control={<Switch checked={settings.aiExplanations} onChange={(v) => update({ aiExplanations: v })} />}
                last
              />
            </Card>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', marginTop: 20 }}>
              Beta covers Uniqlo, H&amp;M, and Amazon. T-shirts first. MaterialIQ only reads the page you're on; nothing leaves your browser except review-summary requests.
            </p>
          </>
        )}

        {active === 'How we score' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Methodology
            </Badge>
            <h1 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>How we score</h1>

            {/* Plain-spoken trust statement. Human voice, honest about the money. */}
            <Card padding="18px 20px" style={{ marginBottom: 24, background: 'var(--surface-card)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--accent)', marginBottom: 8 }}>Our promise</div>
              <p style={{ margin: '0 0 10px', fontSize: 'var(--text-md)', color: 'var(--fg-1)', lineHeight: 1.6 }}>
                The score is math you can check, not our opinion. Every number on this page comes from the same code that scored your item. If you cannot reproduce it yourself, we should not be showing it to you.
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-2)', lineHeight: 1.6 }}>
                We earn a small commission when you buy through a link here. That is a reason to be honest, not a reason to inflate a score. The rules below do not know or care who sells the item.
              </p>
            </Card>

            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--text-md)', margin: '0 0 28px' }}>
              Read this page and you can compute any score by hand. AI writes the review summary and phrases the plain-English explanation. It never sets the number and never picks the verdict. Current rubric: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>{RUBRIC_VERSION}</span>.
            </p>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 12px' }}>The four factors</h2>
            <Card padding="20px" style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <ScoreBar label="Materials" value={10} max={10} detail="Weighted by fiber composition, then adjusted for the garment's use-case (see Use-case scoring)" />
                <ScoreBar label="Construction" value={10} max={10} detail="Yarn type + seam construction: ring-spun/combed, double-stitched, linked seams" />
                <ScoreBar label="Fabric weight" value={5} max={5} detail="GSM banding: 180–220 mid-weight scores highest for tees. Not used for knits or performance wear" />
                <ScoreBar label="Value" value={10} max={10} detail="Weighted quality vs price vs comparable products" />
              </div>
            </Card>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', marginBottom: 16 }}>
              Quality = weighted materials + construction + fabric weight (fabric weight is redistributed when GSM isn't published or isn't relevant). Overall = 60% quality + 40% value. The exact weights depend on the garment's use-case.
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>
              We classify the use-case first — everyday tee, activewear, fine knitwear — from the product title, page details, and fiber mix, using published keyword rules (no AI, so it's reproducible). The use-case decides which fiber adjustments and weights apply, so the same fabric is judged by what the garment is <em>for</em>. See <strong>Use-case scoring</strong> for the full table. Changes are logged against the rubric version above.
            </p>
          </>
        )}

        {active === 'Use-case scoring' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Methodology
            </Badge>
            <h1 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Use-case scoring</h1>
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--text-md)', margin: '0 0 12px' }}>
              A fiber isn't good or bad on its own — it's good or bad <em>for a purpose</em>. Polyester is a liability in a fine sweater but exactly right in a running tee. So we classify the garment's use-case first, then apply that use-case's adjustments to the base material scores. Every number below is read straight from the engine.
            </p>
            <p style={{ color: 'var(--fg-3)', fontSize: 'var(--text-sm)', margin: '0 0 28px' }}>
              Anything we can't confidently classify is graded on the neutral baseline (no adjustments, GSM counts), so an unknown garment is never penalised by a guess.
            </p>
            {DOC_USE_CASES.map((uc) => {
              const p = PROFILES[uc];
              const adjs = (Object.entries(p.fiberAdjust) as [Fiber, number][]).sort((a, b) => b[1] - a[1]);
              return (
                <Card key={uc} padding="18px 20px" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>{p.label}</h2>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-3)' }}>{formatWeights(p)}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-2)', margin: '0 0 12px', lineHeight: 1.5 }}>{p.blurb}</p>
                  {adjs.length > 0 ? (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)', marginBottom: 8 }}>Fiber adjustments</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                        {adjs.map(([fiber, delta]) => (
                          <span key={fiber} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card-2)', color: delta > 0 ? 'var(--score-high)' : 'var(--score-low)' }}>
                            {delta > 0 ? '+' : ''}{delta} {FIBER_LABELS[fiber]}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>No fiber adjustments — uses base material scores.</div>
                  )}
                </Card>
              );
            })}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', marginTop: 8 }}>
              Adjustments are added to the base material scores on the <strong>Material scores</strong> page, then clamped to 0–10. A +3.5 on polyester takes its base 5.0 to 8.5 for activewear.
            </p>
          </>
        )}

        {active === 'Brand premium' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Methodology
            </Badge>
            <h1 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Brand premium</h1>
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--text-md)', margin: '0 0 12px', lineHeight: 1.6 }}>
              This answers one question: are you buying the product, or the brand? We work out what a no-name maker would charge for the same materials and construction, then compare it to the asking price. The gap is the brand premium.
            </p>
            <p style={{ color: 'var(--fg-3)', fontSize: 'var(--text-sm)', margin: '0 0 24px', lineHeight: 1.6 }}>
              A premium is not automatically bad. A well-made garment costs money to make. But you deserve to see how much of the price is cloth and stitching, and how much is the label.
            </p>

            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 6px' }}>The math</h2>
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--text-sm)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Substance price = base + per-point × quality score. Brand premium = (asking price − substance price) ÷ substance price. That is the whole formula.
            </p>
            <Card padding="0 20px" style={{ marginBottom: 24 }}>
              {DOC_USE_CASES.map((uc, i) => {
                const p = PROFILES[uc];
                return (
                  <div key={uc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < DOC_USE_CASES.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                    <span style={{ fontSize: 'var(--text-sm)' }}>{p.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-2)' }}>
                      ${p.substancePrice.base} + ${p.substancePrice.perPoint}/pt · quality 9 ≈ ${(p.substancePrice.base + p.substancePrice.perPoint * 9).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </Card>

            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 10px' }}>What the labels mean</h2>
            <Card padding="0 20px" style={{ marginBottom: 24 }}>
              {[
                ['Priced below its substance', 'Asking price is under what the garment is worth. Rare.'],
                ['Mostly substance', 'Under 25% premium. You are paying for the garment.'],
                ['Some brand premium', '25% to 75%. A normal markup for a real garment.'],
                ['High brand premium', '75% to 150%. A large share is the name.'],
                ['Mostly the label', 'Over 150%. You are mostly paying for the brand.'],
              ].map(([label, desc], i, arr) => (
                <div key={label} style={{ padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </Card>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', lineHeight: 1.6 }}>
              The substance prices above are our current estimates for a generic maker, not live wholesale data. As we add real price data they will get sharper, and any change is logged against the rubric version.
            </p>
          </>
        )}

        {active === 'Material scores' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Methodology
            </Badge>
            <h1 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Material scores</h1>
            <p style={{ color: 'var(--fg-2)', margin: '0 0 24px' }}>Base quality per fiber, before composition weighting. These are the exact values the engine uses.</p>
            <Card padding="0 20px">
              {MATERIAL_ROWS.map(([name, s], i) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < MATERIAL_ROWS.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                  <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: s >= 9 ? 'var(--score-high)' : s <= 3.9 ? 'var(--score-low)' : 'var(--fg-2)' }}>{s.toFixed(1)} / 10</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {active === 'Fabric weight (GSM)' && (
          <>
            <Badge tone="accent" style={{ marginBottom: 16 }}>
              Methodology
            </Badge>
            <h1 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Fabric weight (GSM)</h1>
            <p style={{ color: 'var(--fg-2)', margin: '0 0 24px' }}>Grams per square meter. For tees, 180–220 is the sweet spot, substantial without being stiff. Live from the engine:</p>
            <Card padding="0 20px">
              {GSM_BANDS.map((g, i) => {
                const { score, label } = gsmScore(g);
                return (
                  <div key={g} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < GSM_BANDS.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{g} GSM</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginLeft: 10 }}>{label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: score >= 8.5 ? 'var(--score-high)' : 'var(--fg-2)' }}>{score.toFixed(1)} / 10</span>
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function SettingRow({ title, desc, control, last }: { title: string; desc: string; control: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '16px 0', borderBottom: last ? 'none' : '1px solid var(--border-1)' }}>
      <div>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}
