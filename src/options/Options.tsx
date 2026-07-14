import { useEffect, useState } from 'react';
import { Badge, Card, Switch } from '../design-system/core';
import { ScoreBar } from '../design-system/scores';
import { FIBER_LABELS, FIBER_SCORES, RUBRIC_VERSION, gsmScore } from '../engine/rubric';
import type { Fiber } from '../engine/types';
import { DEFAULT_SETTINGS, getSettings, setSettings, type Settings } from '../lib/settings';

const NAV = [
  ['Extension', ['Settings']],
  ['Methodology', ['How we score', 'Material scores', 'Fabric weight (GSM)']],
] as const;

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
            <p style={{ color: 'var(--fg-2)', fontSize: 'var(--text-md)', margin: '0 0 28px' }}>
              Every score is rule-based and reproducible. Read this page and you can compute the score yourself. That's the bar. AI writes the review summary; it never sets the number. Current rubric: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>{RUBRIC_VERSION}</span>.
            </p>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 12px' }}>The rubric (t-shirts, v1)</h2>
            <Card padding="20px" style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <ScoreBar label="Materials" value={10} max={10} detail="Weighted by fiber composition: organic cotton 10 · cotton 9 · viscose 6 · poly blend 5 · acrylic 4" />
                <ScoreBar label="Construction" value={10} max={10} detail="Yarn type + seam construction: ring-spun/combed, double-stitched, linked seams" />
                <ScoreBar label="Fabric weight" value={5} max={5} detail="GSM banding: 180–220 mid-weight scores highest for tees" />
                <ScoreBar label="Value" value={10} max={10} detail="Weighted quality vs price vs comparable products" />
              </div>
            </Card>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>
              Quality = 45% materials, 35% construction, 20% fabric weight (redistributed when GSM isn't published). Overall = 60% quality + 40% value. Weights are versioned; changes are logged against the rubric version above.
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
