import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ---------- Button (ported verbatim) ---------- */
const btnBase: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'var(--transition-ui)',
  whiteSpace: 'nowrap',
};
const btnSizes: Record<string, CSSProperties> = {
  sm: { height: 'var(--control-h-sm)', padding: '0 12px', fontSize: 'var(--text-sm)' },
  md: { height: 'var(--control-h-md)', padding: '0 16px', fontSize: 'var(--text-sm)' },
  lg: { height: 'var(--control-h-lg)', padding: '0 20px', fontSize: 'var(--text-md)' },
};
const btnVariants: Record<string, CSSProperties> = {
  primary: { background: 'var(--accent)', color: '#fff' },
  secondary: { background: 'var(--surface-card-2)', color: 'var(--fg-1)', borderColor: 'var(--border-1)' },
  ghost: { background: 'transparent', color: 'var(--fg-2)' },
  danger: { background: 'var(--score-low-tint)', color: 'var(--score-low)', borderColor: 'rgba(248,113,113,0.3)' },
};
const btnHover: Record<string, CSSProperties> = {
  primary: { background: 'var(--accent-bright)' },
  secondary: { background: 'var(--surface-card-2)', borderColor: 'var(--border-2)' },
  ghost: { color: 'var(--fg-1)', background: 'rgba(255,255,255,0.05)' },
  danger: { background: 'rgba(248,113,113,0.2)' },
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
      style={{
        ...btnBase,
        ...btnSizes[size],
        ...btnVariants[variant],
        ...(hover && !disabled ? btnHover[variant] : null),
        ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : null),
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- Badge (ported verbatim) ---------- */
const badgeTones: Record<string, CSSProperties> = {
  neutral: { background: 'var(--surface-card-2)', color: 'var(--fg-2)', border: '1px solid var(--border-1)' },
  accent: { background: 'var(--accent-tint)', color: 'var(--accent-bright)', border: '1px solid var(--border-accent)' },
  high: { background: 'var(--score-high-tint)', color: 'var(--score-high)', border: '1px solid rgba(52,211,153,0.3)' },
  low: { background: 'var(--score-low-tint)', color: 'var(--score-low)', border: '1px solid rgba(248,113,113,0.3)' },
};
export function Badge({
  tone = 'neutral',
  mono = false,
  children,
  style,
}: {
  tone?: 'neutral' | 'accent' | 'high' | 'low';
  mono?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        ...badgeTones[tone],
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '22px',
        padding: '0 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: mono ? 0 : 'var(--tracking-caps)',
        textTransform: mono ? 'none' : 'uppercase',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ---------- IconButton ---------- */
export function IconButton({
  label,
  size = 'md',
  children,
  onClick,
  style,
}: {
  label: string;
  size?: 'sm' | 'md';
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const dim = size === 'sm' ? 28 : 34;
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: dim,
        height: dim,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        background: hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: hover ? 'var(--fg-1)' : 'var(--fg-2)',
        cursor: 'pointer',
        transition: 'var(--transition-ui)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Card + CardRow (spec-sheet rows) ---------- */
export function Card({
  glow = false,
  padding = '16px',
  children,
  style,
}: {
  glow?: boolean;
  padding?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid ' + (glow ? 'var(--border-accent)' : 'var(--border-1)'),
        borderRadius: 'var(--radius-lg)',
        boxShadow: glow ? 'var(--glow-accent)' : 'var(--shadow-card)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardRow({ label, sub, value }: { label: ReactNode; sub?: ReactNode; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border-1)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-1)' }}>{label}</div>
        {sub ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: 1 }}>{sub}</div> : null}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-md)', padding: 3 }}>
      {tabs.map((t) => {
        const on = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              flex: 1,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: on ? 600 : 500,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: on ? 'var(--surface-card-2)' : 'transparent',
              color: on ? 'var(--fg-1)' : 'var(--fg-3)',
              transition: 'var(--transition-ui)',
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Input ---------- */
export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  style?: CSSProperties;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 'var(--control-h-md)',
        padding: '0 12px',
        background: 'var(--bg-1)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        border: '1px solid ' + (focus ? 'var(--border-accent)' : 'var(--border-1)'),
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        boxShadow: focus ? 'var(--focus-ring)' : 'none',
        transition: 'var(--transition-ui)',
        ...style,
      }}
    />
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          border: '1px solid ' + (checked ? 'var(--border-accent)' : 'var(--border-1)'),
          background: checked ? 'var(--accent)' : 'var(--surface-card-2)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'var(--transition-ui)',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left var(--dur-base) var(--ease-out)',
          }}
        />
      </button>
      {label ? <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)' }}>{label}</span> : null}
    </label>
  );
}
