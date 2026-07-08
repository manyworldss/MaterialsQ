import { useEffect, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Settings2, Share2, Shirt } from 'lucide-react';
import { Badge, Button, Card, CardRow, IconButton, Tabs } from '../design-system/core';
import { Score, ScoreBar, StarRating, VerdictPill } from '../design-system/scores';
import { analyze } from '../engine/score';
import type { Analysis } from '../engine/types';
import { SAMPLE_TEE } from '../engine/samples';
import { requestActiveTabAnalysis } from '../lib/messages';

const FIBER_BADGES = (a: Analysis) =>
  a.product.composition.map((p) => `${p.percent}% ${p.raw?.replace(/^\d+%\s*/, '') ?? p.fiber}`).slice(0, 3);

function Wordmark() {
  return (
    <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>
      Material<span style={{ color: 'var(--accent-bright)' }}>IQ</span>
    </span>
  );
}

export function Popup() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Score');

  useEffect(() => {
    requestActiveTabAnalysis().then((res) => {
      if (res.analysis) {
        setAnalysis(res.analysis);
      } else {
        setAnalysis(analyze(SAMPLE_TEE)); // demo so the popup is never blank
        setIsDemo(true);
      }
      setLoading(false);
    });
  }, []);

  const openOptions = () => chrome.runtime.openOptionsPage();

  if (loading || !analysis) {
    return (
      <div style={{ width: 'var(--popup-w)', padding: 20, boxSizing: 'border-box', color: 'var(--fg-3)', fontSize: 'var(--text-sm)' }}>
        Analyzing…
      </div>
    );
  }

  const p = analysis.product;
  const scoreFactors = analysis.factors.filter((f) => f.key !== 'value');
  const valueFactor = analysis.factors.find((f) => f.key === 'value');

  return (
    <div
      style={{
        width: 'var(--popup-w)',
        background: 'var(--bg-0)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
        <Wordmark />
        <div style={{ display: 'flex', gap: 2 }}>
          <IconButton label="Share" size="sm">
            <Share2 size={14} />
          </IconButton>
          <IconButton label="Settings" size="sm" onClick={openOptions}>
            <Settings2 size={14} />
          </IconButton>
        </div>
      </div>

      {isDemo && (
        <div style={{ background: 'var(--accent-tint)', color: 'var(--accent-bright)', fontSize: 'var(--text-xs)', padding: '7px 16px', borderBottom: '1px solid var(--border-1)' }}>
          Demo scorecard — open a Uniqlo, H&M, or Amazon product to analyze a real one.
        </div>
      )}

      {/* Product */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-card-2)', border: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)', flexShrink: 0 }}>
          <Shirt size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-3)', display: 'flex', gap: 8 }}>
            <span>{p.retailer.replace(/^www\./, '').replace(/\.com$/, '')}</span>
            {p.price != null && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>${p.price.toFixed(2)}</span>}
          </div>
        </div>
      </div>

      {/* Verdict card — the ONE glow per view */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card glow padding="16px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)', marginBottom: 8 }}>Worth the price?</div>
              <Score value={analysis.overall} />
            </div>
            <VerdictPill verdict={analysis.verdict} />
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)', color: 'var(--fg-2)', lineHeight: 1.5 }}>{analysis.verdictCopy}</p>
        </Card>
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
                {FIBER_BADGES(analysis).map((b, i) => (
                  <Badge key={i} mono>
                    {b}
                  </Badge>
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
                      <span style={{ color: 'var(--score-high)', display: 'flex' }}>
                        <Check size={14} />
                      </span>
                      {t}
                    </div>
                  ))}
                  {p.reviews.cons.map((t, i) => (
                    <div key={`c${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--fg-1)' }}>
                      <span style={{ color: 'var(--score-low)', display: 'flex' }}>
                        <AlertTriangle size={14} />
                      </span>
                      {t}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>
                Review summaries aren't available for this product yet. AI review summarization is coming to the beta retailers first.
              </div>
            )}
          </>
        )}
      </div>

      {/* Alternative */}
      {analysis.alternative && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)' }}>Similar quality, less</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 2 }}>
                {analysis.alternative.name} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--score-high)' }}>${analysis.alternative.price.toFixed(2)}</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" icon={<ExternalLink size={13} />}>
              View
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); openOptions(); }} style={{ fontSize: 'var(--text-xs)' }}>
          How we score →
        </a>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
          {analysis.rubricVersion} · {analysis.analyzedMs}ms
        </span>
      </div>
    </div>
  );
}
