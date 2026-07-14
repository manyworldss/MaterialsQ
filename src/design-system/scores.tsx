import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export function scoreTone(value: number): { color: string; tint: string; extreme: boolean } {
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

/* Self-contained count-up (rAF + IntersectionObserver, reduced-motion aware).
   Kept dependency-free so the shared design system needs no motion library. */
function useCountUp(target: number, enabled: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const el = ref.current;
    if (!el || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const dur = 1150;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          io.disconnect();
          const tick = (t: number) => {
            if (!start) start = t;
            const p = Math.min(1, (t - start) / dur);
            setValue(target * (1 - Math.pow(1 - p, 4)));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, enabled]);
  return { ref, value };
}

/* ---------------- Score ---------------- */
export function Score({ value = 0, label, size = 'lg', style }: { value?: number; label?: string; size?: 'lg' | 'sm'; style?: CSSProperties }) {
  const tone = scoreTone(value);
  const big = size === 'lg';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: big ? 12 : 8, ...style }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, lineHeight: 1, fontSize: big ? 'var(--text-score)' : 'var(--text-score-sm)', color: tone.color }}>{value.toFixed(1)}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 'var(--text-md)' : 'var(--text-xs)', color: 'var(--fg-3)' }}>/10</span>
      <span style={{ fontSize: big ? 'var(--text-sm)' : 'var(--text-xs)', fontWeight: 600, color: tone.extreme ? tone.color : 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>{label ?? scoreLabel(value)}</span>
    </div>
  );
}

/* ---------------- ScoreBar ---------------- */
export function ScoreBar({ label, value = 0, max = 10, detail, style }: { label: string; value?: number; max?: number; detail?: ReactNode; style?: CSSProperties }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const ratio = value / max;
  const fill = ratio >= 0.85 ? 'var(--score-high)' : ratio <= 0.39 ? 'var(--score-low)' : 'var(--accent)';
  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>
          {value.toFixed(1)}
          <span style={{ color: 'var(--fg-3)' }}> / {max}</span>
        </span>
      </div>
      <div style={{ flex: 1, height: 6, background: 'var(--surface-card-2)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 999, background: fill, transformOrigin: 'left', transform: `scaleX(${pct / 100})`, transition: 'transform var(--dur-slow) var(--ease-out)' }} />
      </div>
      {detail ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-2)', marginTop: 5 }}>{detail}</div> : null}
    </div>
  );
}

/* ---------------- VerdictPill — printed stamp ---------------- */
export type Verdict = 'worth' | 'fair' | 'skip';
const verdictStyles: Record<Verdict, { text: string; color: string; tint: string; border: string }> = {
  worth: { text: 'Worth it', color: 'var(--score-high)', tint: 'var(--score-high-tint)', border: 'rgba(14,124,74,0.35)' },
  fair: { text: 'Fair price', color: 'var(--fg-1)', tint: 'var(--surface-card)', border: 'var(--border-2)' },
  skip: { text: 'Skip this one', color: 'var(--score-low)', tint: 'var(--score-low-tint)', border: 'rgba(192,57,43,0.35)' },
};
export function VerdictPill({ verdict = 'fair', text, size = 'md', style }: { verdict?: Verdict; text?: string; size?: 'md' | 'lg'; style?: CSSProperties }) {
  const v = verdictStyles[verdict];
  const big = size === 'lg';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: big ? 36 : 26, padding: big ? '0 16px' : '0 12px', borderRadius: 'var(--radius-sm)', background: v.tint, border: `1px solid ${v.border}`, color: v.color, fontSize: big ? 'var(--text-sm)' : 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', ...style }}>
      <span style={{ width: big ? 8 : 6, height: big ? 8 : 6, borderRadius: '50%', background: v.color }} />
      {text ?? v.text}
    </span>
  );
}

/* ---------------- StarRating ---------------- */
export function StarRating({ value = 0, max = 5, caption, style }: { value?: number; max?: number; caption?: ReactNode; style?: CSSProperties }) {
  const glyph = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';
  const stars = [];
  for (let i = 1; i <= max; i++) {
    const fill = value >= i ? 1 : value > i - 1 ? value - (i - 1) : 0;
    stars.push(
      <span key={i} style={{ position: 'relative', width: 16, height: 16, display: 'inline-block' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--surface-card-2)" style={{ position: 'absolute', inset: 0 }}>
          <path d={glyph} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--fg-1)">
            <path d={glyph} />
          </svg>
        </span>
      </span>,
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>{stars}</span>
      {caption ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>{caption}</span> : null}
    </div>
  );
}

/* ---------------- HangTag — score as a garment tag ---------------- */
export function HangTag({
  label = 'MATERIAL QUALITY',
  value = 0,
  verdict,
  details = [],
  size = 'md',
  countUp = false,
  style,
}: {
  label?: string;
  value?: number;
  verdict?: string;
  details?: { k: string; v: string }[];
  size?: 'md' | 'lg';
  countUp?: boolean;
  style?: CSSProperties;
}) {
  const big = size === 'lg';
  const tone = scoreTone(value).color;
  const { ref, value: shown } = useCountUp(value, countUp);
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: big ? 240 : 190, background: 'var(--surface-card)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', padding: big ? '28px 22px 18px' : '22px 18px 14px', textAlign: 'center', ...style }}>
      <span style={{ position: 'absolute', top: big ? 10 : 8, left: '50%', transform: 'translateX(-50%)', width: big ? 12 : 10, height: big ? 12 : 10, borderRadius: '50%', background: 'var(--bg-0)', border: '1px solid var(--border-2)', boxShadow: 'inset 0 1px 2px rgba(22,24,26,0.15)' }} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', color: 'var(--fg-2)', marginTop: big ? 10 : 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, margin: big ? '10px 0 2px' : '8px 0 2px' }}>
        <span ref={ref} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: big ? 'var(--text-score)' : 34, lineHeight: 1, color: tone }}>{shown.toFixed(1)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>/10</span>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: tone === 'var(--score-neutral)' ? 'var(--fg-2)' : tone, marginBottom: big ? 14 : 10 }}>{verdict ?? scoreLabel(value)}</div>
      {details.length > 0 ? (
        <div style={{ borderTop: '1px dashed var(--border-2)', paddingTop: big ? 12 : 10, display: 'grid', gap: 4 }}>
          {details.map((d, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-2)', display: 'flex', justifyContent: 'space-between', gap: 12, textAlign: 'left' }}>
              <span style={{ color: 'var(--fg-3)' }}>{d.k}</span>
              <span>{d.v}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
