/* The injected badge — ALWAYS dark, floating on the retailer's light page.
   Driven by a real Analysis. Ported from the design system's inline_badge kit. */

import { useState } from 'react';
import type { Analysis } from '../engine/types';
import { ScoreBar, VerdictPill } from '../design-system/scores';

const verdictColor: Record<string, string> = {
  worth: 'var(--score-high)',
  fair: 'var(--accent-bright)',
  skip: 'var(--score-low)',
};
const verdictShort: Record<string, string> = { worth: 'Worth it', fair: 'Fair price', skip: 'Skip it' };

export function InlineBadge({ analysis, docsUrl }: { analysis: Analysis; docsUrl: string }) {
  const [open, setOpen] = useState(false);
  const dot = verdictColor[analysis.verdict];
  const top = analysis.factors.filter((f) => f.key !== 'value').slice(0, 3);

  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: 'var(--font-sans)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 30,
          padding: '0 12px',
          background: 'var(--bg-0)',
          color: 'var(--fg-1)',
          border: '1px solid rgba(139,92,246,0.5)',
          borderRadius: 999,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: open ? 'var(--glow-accent)' : '0 2px 8px rgba(0,0,0,0.18)',
          transition: 'var(--transition-ui)',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}` }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{analysis.overall.toFixed(1)}</span>
        <span style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{verdictShort[analysis.verdict]}</span>
        <span style={{ color: 'var(--accent-bright)', fontWeight: 800, letterSpacing: '-0.01em' }}>IQ</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: 300,
            zIndex: 2147483647,
            background: 'var(--bg-0)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-pop)',
            padding: 16,
            color: 'var(--fg-1)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>
              Material<span style={{ color: 'var(--accent-bright)' }}>IQ</span>
            </span>
            <VerdictPill verdict={analysis.verdict} />
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>{analysis.verdictCopy}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {top.map((f) => (
              <ScoreBar key={f.key} label={f.label} value={f.value} max={f.max} />
            ))}
          </div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', fontSize: 12, marginTop: 12, color: 'var(--accent-bright)' }}
          >
            How we score →
          </a>
        </div>
      )}
    </span>
  );
}
