import type { CSSProperties, ReactNode } from 'react';

/* Score semantics — neutral by default; color ONLY at extremes (≥8.5 green, ≤3.9 red). */
export function scoreTone(value: number) {
  if (value >= 8.5) return { color: 'var(--score-high)', tint: 'var(--score-high-tint)', extreme: true };
  if (value <= 3.9) return { color: 'var(--score-low)', tint: 'var(--score-low-tint)', extreme: true };
  return { color: 'var(--score-neutral)', tint: 'transparent', extreme: false };
}

export function scoreLabel(value: number): string {
  if (value >= 9) return 'Exceptional';
  if (value >= 8.5) return 'Excellent';
  if (value >= 7) return 'Good';
  if (value >= 5.5) return 'Fair';
  if (value >= 4) return 'Below average';
  return 'Poor';
}

type ScoreProps = {
  value?: number;
  label?: string;
  size?: 'lg' | 'sm';
  style?: CSSProperties;
};

/* Numeric score + label. The signature "lab readout" — always mono. */
export function Score({ value = 0, label, size = 'lg', style }: ScoreProps) {
  const tone = scoreTone(value);
  const big = size === 'lg';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: big ? '12px' : '8px', ...style }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          lineHeight: 1,
          fontSize: big ? 'var(--text-score)' : 'var(--text-score-sm)',
          color: tone.color,
          textShadow: tone.extreme && big ? '0 0 24px ' + tone.tint.replace('0.12', '0.5') : 'none',
        }}
      >
        {value.toFixed(1)}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 'var(--text-md)' : 'var(--text-xs)', color: 'var(--fg-3)' }}>/10</span>
      <span
        style={{
          fontSize: big ? 'var(--text-sm)' : 'var(--text-xs)',
          fontWeight: 600,
          color: tone.extreme ? tone.color : 'var(--fg-2)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-caps)',
        }}
      >
        {label ?? scoreLabel(value)}
      </span>
    </div>
  );
}

type ScoreBarProps = {
  label: string;
  value?: number;
  max?: number;
  detail?: ReactNode;
  style?: CSSProperties;
};

export function ScoreBar({ label, value = 0, max = 10, detail, style }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const ratio = value / max;
  const fill = ratio >= 0.85 ? 'var(--score-high)' : ratio <= 0.39 ? 'var(--score-low)' : 'var(--accent)';
  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '12px' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>
          {value.toFixed(1)}
          <span style={{ color: 'var(--fg-3)' }}> / {max}</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--surface-card-2)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 999, background: fill, transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
      {detail ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: '5px' }}>{detail}</div> : null}
    </div>
  );
}

export type Verdict = 'worth' | 'fair' | 'skip';

const verdictStyles: Record<Verdict, { text: string; color: string; tint: string; border: string }> = {
  worth: { text: 'Worth it', color: 'var(--score-high)', tint: 'var(--score-high-tint)', border: 'rgba(52,211,153,0.35)' },
  fair: { text: 'Fair price', color: 'var(--fg-1)', tint: 'var(--surface-card-2)', border: 'rgba(255,255,255,0.14)' },
  skip: { text: 'Skip this one', color: 'var(--score-low)', tint: 'var(--score-low-tint)', border: 'rgba(248,113,113,0.35)' },
};

export function VerdictPill({ verdict = 'fair', text, size = 'md', style }: { verdict?: Verdict; text?: string; size?: 'md' | 'lg'; style?: CSSProperties }) {
  const v = verdictStyles[verdict];
  const big = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: big ? 36 : 26,
        padding: big ? '0 16px' : '0 12px',
        borderRadius: 'var(--radius-pill)',
        background: v.tint,
        border: '1px solid ' + v.border,
        color: v.color,
        fontSize: big ? 'var(--text-md)' : 'var(--text-sm)',
        fontWeight: 700,
        ...style,
      }}
    >
      <span style={{ width: big ? 8 : 6, height: big ? 8 : 6, borderRadius: '50%', background: v.color, boxShadow: '0 0 8px ' + v.color }} />
      {text ?? v.text}
    </span>
  );
}

export function StarRating({ value = 0, max = 5, caption, style }: { value?: number; max?: number; caption?: ReactNode; style?: CSSProperties }) {
  const stars = [];
  const glyph = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';
  for (let i = 1; i <= max; i++) {
    const fill = value >= i ? 1 : value > i - 1 ? value - (i - 1) : 0;
    stars.push(
      <span key={i} style={{ position: 'relative', width: 16, height: 16, display: 'inline-block' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--surface-card-2)" style={{ position: 'absolute', inset: 0 }}>
          <path d={glyph} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, width: fill * 100 + '%', overflow: 'hidden' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--accent-bright)">
            <path d={glyph} />
          </svg>
        </span>
      </span>,
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', ...style }}>
      <span style={{ display: 'inline-flex', gap: '3px' }}>{stars}</span>
      {caption ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>{caption}</span> : null}
    </div>
  );
}
