import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Check, ExternalLink, Info, RefreshCw, Settings2, Share2 } from 'lucide-react';
import { Badge, Button, Card, CardRow, IconButton, Tabs } from '../design-system/core';
import { ScoreBar, StarRating, VerdictPill, scoreTone } from '../design-system/scores';
import type { Analysis } from '../engine/types';
import { affiliateUrl } from '../lib/config';

const VERDICT_TEXT: Record<string, string> = { worth: 'Worth it', fair: 'Fair price', skip: 'Skip this one' };

function Wordmark() {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontStretch: '125%', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--fg-1)' }}>
      Material<span style={{ color: 'var(--accent)' }}>IQ</span>
    </span>
  );
}

function specChips(a: Analysis) {
  const p = a.product;
  const d: { k: string; v: string }[] = [];
  const primary = [...p.composition].sort((x, y) => y.percent - x.percent)[0];
  if (primary) d.push({ k: 'FIBER', v: primary.raw?.replace(/^\d+%\s*/, '') ?? primary.fiber });
  if (p.gsm != null) d.push({ k: 'WEIGHT', v: `${p.gsm} GSM` });
  if (p.price != null) d.push({ k: 'ASKING', v: `$${p.price.toFixed(2)}` });
  return d;
}

/* Presentational scorecard shared by the popup and the side panel. It fills its
   window flush (no floating card) — the surface IS the panel. Data fetching
   lives in each surface. `onRefresh` adds a re-check button; `headerExtra` adds
   surface-specific buttons; `children` slots extra modules above the footer. */
export function Scorecard({
  analysis,
  isDemo,
  onOpenOptions,
  onRefresh,
  headerExtra,
  children,
}: {
  analysis: Analysis;
  isDemo?: boolean;
  onOpenOptions: () => void;
  onRefresh?: () => boolean | void | Promise<boolean | void>;
  headerExtra?: ReactNode;
  children?: ReactNode;
}) {
  const [tab, setTab] = useState('Score');
  const [shared, setShared] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const p = analysis.product;
  const scoreFactors = analysis.factors.filter((f) => f.key !== 'value');
  const valueFactor = analysis.factors.find((f) => f.key === 'value');
  const cpw = analysis.costPerWear;
  const tone = scoreTone(analysis.overall).color;

  const shareVerdict = async () => {
    const text = `${p.title} — ${analysis.overall.toFixed(1)}/10, ${VERDICT_TEXT[analysis.verdict]}. ${analysis.verdictCopy} (via MaterialIQ)`;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  const refresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    setRefreshNote(null);
    try {
      // Run the re-check and a minimum spin together so the click is always felt.
      const [found] = await Promise.all([Promise.resolve(onRefresh()), new Promise((r) => setTimeout(r, 550))]);
      if (found === false) {
        setRefreshNote('No product detected on this page.');
        setTimeout(() => setRefreshNote(null), 3200);
      }
    } finally {
      setRefreshing(false);
    }
  };
  const openAlternative = () => {
    if (!analysis.alternative) return;
    if (analysis.alternative.url) {
      window.open(affiliateUrl(analysis.alternative.url), '_blank', 'noopener');
    } else {
      window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(analysis.alternative.name)}`, '_blank', 'noopener');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
        <Wordmark />
        <div style={{ display: 'flex', gap: 2 }}>
          {onRefresh && (
            <IconButton label="Re-check this page" size="sm" onClick={refresh}>
              <span style={{ display: 'inline-flex', animation: refreshing ? 'miq-spin 0.8s linear infinite' : 'none' }}>
                <RefreshCw size={14} />
              </span>
            </IconButton>
          )}
          <IconButton label={shared ? 'Copied' : 'Copy verdict'} size="sm" active={shared} onClick={shareVerdict}>
            {shared ? <Check size={14} /> : <Share2 size={14} />}
          </IconButton>
          <IconButton label="Settings" size="sm" onClick={onOpenOptions}><Settings2 size={14} /></IconButton>
          {headerExtra}
        </div>
      </div>

      {refreshNote ? (
        <div style={{ background: 'var(--surface-card-2)', color: 'var(--fg-1)', fontSize: 'var(--text-xs)', padding: '7px 16px', borderBottom: '1px solid var(--border-1)' }}>{refreshNote}</div>
      ) : isDemo ? (
        <div style={{ background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 'var(--text-xs)', padding: '7px 16px', borderBottom: '1px solid var(--border-1)' }}>
          Demo: open a Uniqlo, H&amp;M, or Amazon product to score a real one.
        </div>
      ) : null}

      {/* Product line */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)', flexShrink: 0 }}>
          {p.retailer.replace(/^www\./, '').replace(/\.com$/, '')}
          {p.price != null ? ` · $${p.price.toFixed(2)}` : ''}
        </span>
      </div>

      {/* Verdict — flush, full width (no nested box) */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-2)', marginBottom: 8 }}>Worth the price?</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-score)', lineHeight: 1, color: tone }}>{analysis.overall.toFixed(1)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--fg-3)' }}>/10</span>
          </div>
          <VerdictPill verdict={analysis.verdict} size="lg" />
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)', color: 'var(--fg-2)', lineHeight: 1.5 }}>{analysis.verdictCopy}</p>
        {cpw && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-2)' }}>
            ≈ ${cpw.perWear.toFixed(2)} / wear · ~{cpw.wears} wears over ~{cpw.years} yrs
          </div>
        )}

        {/* Spec strip — full width, hairline top, not a card */}
        {specChips(analysis).length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-1)', display: 'flex', gap: '6px 18px', flexWrap: 'wrap' }}>
            {specChips(analysis).map((d) => (
              <span key={d.k} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--fg-3)' }}>{d.k}</span> <span style={{ color: 'var(--fg-1)' }}>{d.v}</span>
              </span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>Explanation by AI · scoring is rules, not AI</div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 16px 0' }}>
        <Tabs tabs={['Score', 'Materials', 'Reviews']} active={tab} onChange={setTab} />
      </div>

      <div style={{ padding: '14px 16px 16px', display: 'grid', gap: 14 }}>
        {tab === 'Score' && (
          <>
            {scoreFactors.map((f) => (
              <ScoreBar key={f.key} label={f.label} value={f.value} max={f.max} detail={f.detail} />
            ))}
            {valueFactor && <ScoreBar label={valueFactor.label} value={valueFactor.value} max={valueFactor.max} detail={valueFactor.detail} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-1)', fontWeight: 500 }}>Expected lifespan</span>
              <StarRating value={analysis.durabilityStars} caption={analysis.durabilityCaption} />
            </div>
          </>
        )}

        {tab === 'Materials' && (
          <>
            {p.composition.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.composition.map((c, i) => (
                  <Badge key={i} mono>{c.percent}% {c.raw?.replace(/^\d+%\s*/, '') ?? c.fiber}</Badge>
                ))}
                {p.gsm != null && <Badge mono>{p.gsm} GSM</Badge>}
                {p.yarn !== 'unknown' && <Badge mono>{p.yarn}</Badge>}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>No fiber content was published on this page.</div>
            )}
            <Card padding="0 16px">
              {p.composition.map((c, i) => (
                <CardRow key={i} label={c.raw?.replace(/^\d+%\s*/, '') ?? c.fiber} sub={`${c.percent}% of fabric`} value={`${c.percent}%`} />
              ))}
              {p.gsm != null && <CardRow label="Weight" sub="Fabric weight" value={`${p.gsm} GSM`} />}
              {p.origin && <CardRow label="Origin" value={p.origin} />}
            </Card>
            {analysis.careAndFlags?.length > 0 && (
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)', marginBottom: 4 }}>Care & Quality Flags</div>
                {analysis.careAndFlags.map((flag, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--fg-1)', background: 'var(--surface-card)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                    <span style={{ color: flag.type === 'warning' ? 'var(--score-low)' : 'var(--score-mid)', display: 'flex' }}>
                      {flag.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                    </span>
                    {flag.text}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Reviews' && (
          <>
            {p.reviews ? (
              <>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)' }}>Summarized from {p.reviews.count.toLocaleString()} reviews</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {p.reviews.pros.map((t, i) => (
                    <div key={`p${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--fg-1)' }}>
                      <span style={{ color: 'var(--score-high)', display: 'flex' }}><Check size={14} /></span>
                      {t}
                    </div>
                  ))}
                  {p.reviews.cons.map((t, i) => (
                    <div key={`c${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--fg-1)' }}>
                      <span style={{ color: 'var(--score-low)', display: 'flex' }}><AlertTriangle size={14} /></span>
                      {t}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)', lineHeight: 1.5 }}>AI review summaries arrive at launch. The score is rule-based and doesn't need them. You're seeing the full verdict already.</div>
            )}
          </>
        )}
      </div>

      {/* Alternative */}
      {analysis.alternative && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)' }}>Similar quality, less</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 2 }}>
                {analysis.alternative.name} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--score-high)' }}>${analysis.alternative.price.toFixed(2)}</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" icon={<ExternalLink size={13} />} onClick={openAlternative}>View</Button>
          </div>
        </div>
      )}

      {children}

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenOptions(); }} style={{ fontSize: 'var(--text-xs)' }}>How we score →</a>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)' }}>{analysis.rubricVersion} · {analysis.analyzedMs}ms</span>
      </div>
    </div>
  );
}
