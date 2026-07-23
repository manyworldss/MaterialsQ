/* The injected badge — ALWAYS ink-dark, pinned to the retailer's light page.
   Opens a frosted-glass mini-card. New cream/azure/ink design system. */

import { useRef, useState } from 'react';
import type { Analysis } from '../engine/types';
import { ScoreBar, VerdictPill } from '../design-system/scores';

const VERDICT_DOT: Record<string, string> = { worth: 'var(--score-high)', fair: 'var(--fg-inverse-2)', skip: 'var(--score-low)' };
const VERDICT_SHORT: Record<string, string> = { worth: 'Worth it', fair: 'Fair price', skip: 'Skip it' };

const CARD_W = 300;
const CARD_H = 220; // approximate; only used to decide flip direction

export function InlineBadge({ analysis, docsUrl }: { analysis: Analysis; docsUrl: string }) {
  const [open, setOpen] = useState(false);
  // Which way the card opens, decided from viewport space at toggle time so it
  // never spills off-screen (the badge may be docked in a corner).
  const [dir, setDir] = useState<{ up: boolean; right: boolean }>({ up: false, right: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const top = analysis.factors.filter((f) => f.key !== 'value').slice(0, 3);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDir({
        up: r.bottom + CARD_H > window.innerHeight && r.top - CARD_H > 0,
        right: r.left + CARD_W > window.innerWidth,
      });
    }
    setOpen((o) => !o);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: 'var(--font-sans)' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 30,
          padding: '0 12px',
          background: 'var(--ink-0)',
          color: 'var(--fg-inverse)',
          border: '1px solid ' + (open ? 'var(--accent)' : 'var(--ink-0)'),
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(22,24,26,0.18)',
          transition: 'var(--transition-ui)',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: VERDICT_DOT[analysis.verdict] }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{analysis.overall.toFixed(1)}</span>
        <span style={{ color: 'var(--fg-inverse-2)', fontWeight: 500 }}>{VERDICT_SHORT[analysis.verdict]}</span>
        <span style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-display)', fontStretch: '125%', fontWeight: 800 }}>IQ</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: dir.up ? undefined : 'calc(100% + 10px)',
            bottom: dir.up ? 'calc(100% + 10px)' : undefined,
            left: dir.right ? undefined : 0,
            right: dir.right ? 0 : undefined,
            width: CARD_W,
            zIndex: 2147483647,
            background: 'var(--glass-fill-strong)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(1.15)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.15)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-glass)',
            padding: 16,
            color: 'var(--fg-1)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStretch: '125%', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>
              Material<span style={{ color: 'var(--accent)' }}>IQ</span>
            </span>
            <VerdictPill verdict={analysis.verdict} />
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>{analysis.verdictCopy}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {top.map((f) => (
              <ScoreBar key={f.key} label={f.label} value={f.value} max={f.max} />
            ))}
          </div>
          <a href={docsUrl} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12, marginTop: 12, color: 'var(--accent)' }}>
            Open full scorecard →
          </a>
        </div>
      )}
    </span>
  );
}
