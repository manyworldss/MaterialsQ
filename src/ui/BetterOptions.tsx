import { ExternalLink } from 'lucide-react';
import type { BetterOption } from '../engine/types';

/* Cross-retailer "better value" options. The side panel's headline value-add:
   for any product, where to get more for your money. Each row links out to a
   shopping search (real product URLs come with the price index). */
export function BetterOptions({ options }: { options: BetterOption[] }) {
  if (options.length === 0) return null;
  const open = (o: BetterOption) => {
    if (o.url) {
      window.open(`http://localhost:8787/api/go?target=${encodeURIComponent(o.url)}`, '_blank', 'noopener');
    } else {
      window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(o.name)}`, '_blank', 'noopener');
    }
  };
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', color: 'var(--accent)', marginBottom: 10 }}>
        Better value elsewhere
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => open(o)}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-1)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
              padding: '11px 13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontFamily: 'var(--font-sans)',
              transition: 'var(--transition-ui)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--score-high)', flexShrink: 0 }}>${o.price.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-2)', marginTop: 2 }}>
                <span style={{ textTransform: 'capitalize' }}>{o.retailer.replace(/\.com$/, '')}</span> · {o.reason}
              </div>
            </div>
            <span style={{ color: 'var(--fg-3)', display: 'flex', flexShrink: 0 }}><ExternalLink size={14} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
