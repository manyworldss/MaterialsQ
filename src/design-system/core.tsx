import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ---------------- Button — care-label: uppercase, tracked, crisp ---------------- */
const btnBase: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'var(--transition-ui)',
  whiteSpace: 'nowrap',
};
const btnSizes: Record<string, CSSProperties> = {
  sm: { height: 'var(--control-h-sm)', padding: '0 12px', fontSize: 11 },
  md: { height: 'var(--control-h-md)', padding: '0 18px', fontSize: 12 },
  lg: { height: 'var(--control-h-lg)', padding: '0 24px', fontSize: 13 },
};
const btnVariants: Record<string, CSSProperties> = {
  primary: { background: 'var(--accent)', color: '#fff' },
  secondary: { background: 'transparent', color: 'var(--fg-1)', borderColor: 'var(--border-2)' },
  ghost: { background: 'transparent', color: 'var(--fg-2)' },
  danger: { background: 'var(--score-low-tint)', color: 'var(--score-low)', borderColor: 'rgba(192,57,43,0.35)' },
};
const btnHover: Record<string, CSSProperties> = {
  primary: { background: 'var(--accent-dim)' },
  secondary: { borderColor: 'var(--fg-1)', background: 'rgba(22,24,26,0.04)' },
  ghost: { color: 'var(--fg-1)', background: 'rgba(22,24,26,0.05)' },
  danger: { background: 'rgba(192,57,43,0.18)' },
};
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  children,
  onClick,
  style,
}: {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...btnBase, ...btnSizes[size], ...btnVariants[variant], ...(hover && !disabled ? btnHover[variant] : null), ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : null), ...style }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- Badge ---------------- */
const badgeTones: Record<string, CSSProperties> = {
  neutral: { background: 'var(--surface-card)', color: 'var(--fg-2)', border: '1px solid var(--border-1)' },
  accent: { background: 'var(--accent-tint)', color: 'var(--accent)', border: '1px solid var(--border-accent)' },
  high: { background: 'var(--score-high-tint)', color: 'var(--score-high)', border: '1px solid rgba(14,124,74,0.3)' },
  low: { background: 'var(--score-low-tint)', color: 'var(--score-low)', border: '1px solid rgba(192,57,43,0.3)' },
  ink: { background: 'var(--ink-0)', color: 'var(--fg-inverse)', border: '1px solid var(--ink-0)' },
};
export function Badge({ tone = 'neutral', mono = false, children, style }: { tone?: 'neutral' | 'accent' | 'high' | 'low' | 'ink'; mono?: boolean; children?: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ ...badgeTones[tone], display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: mono ? 0 : 'var(--tracking-caps)', textTransform: mono ? 'none' : 'uppercase', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', ...style }}>
      {children}
    </span>
  );
}

/* ---------------- IconButton ---------------- */
export function IconButton({ label, size = 'md', active = false, children, onClick, style }: { label: string; size?: 'sm' | 'md' | 'lg'; active?: boolean; children?: ReactNode; onClick?: () => void; style?: CSSProperties }) {
  const [hover, setHover] = useState(false);
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: dim, height: dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--accent-tint)' : hover ? 'rgba(22,24,26,0.05)' : 'transparent', color: active ? 'var(--accent)' : hover ? 'var(--fg-1)' : 'var(--fg-2)', border: '1px solid ' + (active ? 'var(--border-accent)' : 'transparent'), borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition-ui)', ...style }}
    >
      {children}
    </button>
  );
}

/* ---------------- Card + CardRow ---------------- */
export function Card({ padding = 'var(--space-5)', children, style }: { padding?: string; children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding, ...style }}>{children}</div>;
}
export function CardRow({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-1)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)', fontWeight: 500 }}>{label}</div>
        {sub ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)' }}>{sub}</div> : null}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

/* ---------------- Tabs ---------------- */
function TabButton({ t, sel, onClick }: { t: string; sel: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        height: 28,
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'calc(var(--radius-md) - 3px)',
        background: sel ? 'var(--surface-card)' : hover ? 'rgba(22,24,26,0.05)' : 'transparent',
        boxShadow: sel ? 'var(--shadow-card)' : 'none',
        color: sel ? 'var(--fg-1)' : hover ? 'var(--fg-1)' : 'var(--fg-2)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        transition: 'var(--transition-ui)',
      }}
    >
      {t}
    </button>
  );
}
export function Tabs({ tabs, active, onChange, style }: { tabs: string[]; active: string; onChange: (t: string) => void; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-md)', padding: 3, ...style }}>
      {tabs.map((t) => (
        <TabButton key={t} t={t} sel={t === active} onClick={() => onChange(t)} />
      ))}
    </div>
  );
}

/* ---------------- Input ---------------- */
export function Input({ value, onChange, placeholder, type = 'text', style }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: CSSProperties }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ width: '100%', boxSizing: 'border-box', height: 'var(--control-h-md)', padding: '0 12px', background: 'var(--surface-card)', color: 'var(--fg-1)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', border: '1px solid ' + (focus ? 'var(--border-accent)' : 'var(--border-2)'), borderRadius: 'var(--radius-md)', outline: 'none', boxShadow: focus ? 'var(--focus-ring)' : 'none', transition: 'var(--transition-ui)', ...style }}
    />
  );
}

/* ---------------- Switch ---------------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{ width: 38, height: 22, borderRadius: 999, border: '1px solid ' + (checked ? 'var(--accent)' : 'var(--border-2)'), background: checked ? 'var(--accent)' : 'var(--surface-card-2)', position: 'relative', cursor: 'pointer', transition: 'var(--transition-ui)', padding: 0 }}
      >
        <span style={{ position: 'absolute', top: 2, left: 2, transform: checked ? 'translateX(16px)' : 'translateX(0)', width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(22,24,26,0.3)', transition: 'transform var(--dur-ui) var(--ease-out)' }} />
      </button>
      {label ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)' }}>{label}</span> : null}
    </label>
  );
}

/* ---------------- GlassPanel — the one legitimate glass use ---------------- */
export function GlassPanel({ strong = false, padding = 'var(--space-5)', children, style }: { strong?: boolean; padding?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: strong ? 'var(--glass-fill-strong)' : 'var(--glass-fill)', backdropFilter: 'blur(var(--glass-blur)) saturate(1.15)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.15)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-glass)', padding, ...style }}>
      {children}
    </div>
  );
}

/* ---------------- Marquee ---------------- */
export function Marquee({ items, speed = 30, separator = '·', inverse = false, style }: { items: string[]; speed?: number; separator?: string; inverse?: boolean; style?: CSSProperties }) {
  const [paused, setPaused] = useState(false);
  const row = items.map((it, i) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
      <span>{it}</span>
      <span style={{ color: inverse ? 'var(--border-inverse-2)' : 'var(--fg-3)' }}>{separator}</span>
    </span>
  ));
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} style={{ overflow: 'hidden', whiteSpace: 'nowrap', userSelect: 'none', borderTop: `1px solid ${inverse ? 'var(--border-inverse)' : 'var(--border-1)'}`, borderBottom: `1px solid ${inverse ? 'var(--border-inverse)' : 'var(--border-1)'}`, padding: '14px 0', color: inverse ? 'var(--fg-inverse-2)' : 'var(--fg-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', ...style }}>
      <div style={{ display: 'inline-flex', gap: 24, animation: `miq-marquee ${speed}s linear infinite`, animationPlayState: paused ? 'paused' : 'running' }}>
        <span style={{ display: 'inline-flex', gap: 24 }}>{row}</span>
        <span style={{ display: 'inline-flex', gap: 24 }} aria-hidden="true">{row}</span>
      </div>
    </div>
  );
}
