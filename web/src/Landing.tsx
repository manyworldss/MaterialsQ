import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Badge, Button, Card, CardRow, GlassPanel, HangTag, Marquee, ScoreBar, Tabs, VerdictPill } from '@ds';
import { useSmoothScroll } from './lib/smooth';
import { Reveal, useCountUp } from './lib/motion';

const PAGE = 'var(--page-max-w)';

const displayType: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStretch: '125%',
  fontWeight: 800,
  letterSpacing: 'var(--display-tracking)',
  lineHeight: 'var(--leading-tight)',
  textTransform: 'uppercase',
};
const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--accent)',
};

function Icon({ name, size = 16 }: { name: 'check' | 'alert' | 'x'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'check') return (<svg {...p}><path d="M4 12.5l5 5 11-11" /></svg>);
  if (name === 'x') return (<svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
  return (<svg {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></svg>);
}

function Wordmark({ size = 16, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <span style={{ ...displayType, fontSize: size, letterSpacing: '0.02em', color: inverse ? 'var(--fg-inverse)' : 'var(--fg-1)' }}>
      Material<span style={{ color: inverse ? 'var(--accent-bright)' : 'var(--accent)' }}>IQ</span>
    </span>
  );
}

/* ---------------------------------------------------------------- Nav */
function Nav({ onCta }: { onCta: () => void }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 40px)',
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--glass-fill)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      <Wordmark />
      <div className="nav-links">
        <a className="miq-navlink" href="#how" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>How it works</a>
        <a className="miq-navlink" href="#method" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Methodology</a>
        <Button size="md" onClick={onCta}>Add to Chrome</Button>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- Hero */
function Hero({ onCta }: { onCta: () => void }) {
  return (
    <header className="hero-grid" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px) 72px', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center' }}>
      <div>
        <Reveal><div style={{ ...eyebrow, marginBottom: 20 }}>Free browser extension · Beta</div></Reveal>
        <Reveal delay={0.06}>
          <h1 style={{ ...displayType, fontSize: 'clamp(44px, 8vw, 76px)', margin: 0 }}>
            Know what
            <br />
            it's <span style={{ color: 'var(--accent)' }}>worth.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--fg-2)', maxWidth: 480, margin: '24px 0 32px', lineHeight: 1.55 }}>
            MaterialIQ reads the fabric, the stitching, and the price, then tells you if a product deserves your money. Before you buy, not after.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={onCta}>Add to Chrome, free</Button>
            <Button size="lg" variant="secondary" onClick={() => document.getElementById('method')?.scrollIntoView({ behavior: 'smooth' })}>See the methodology</Button>
          </div>
        </Reveal>
        <Reveal delay={0.24}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: 16 }}>No account. No tracking. Scores you can audit.</div>
        </Reveal>
      </div>
      <Reveal delay={0.16}>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <HangTag label="WORTH THE PRICE?" value={8.7} verdict="Worth it" size="lg" countUp details={[{ k: 'FIBER', v: '100% cotton' }, { k: 'WEIGHT', v: '185 GSM' }, { k: 'ASKING', v: '$29.90' }, { k: 'COMPARABLE', v: '$32–48' }]} style={{ transform: 'rotate(3deg)' }} />
          <HangTag label="MATERIAL QUALITY" value={3.1} verdict="Skip this one" details={[{ k: 'FIBER', v: '100% acrylic' }, { k: 'ASKING', v: '$89.00' }]} style={{ transform: 'rotate(-5deg) translate(-24px, 48px)', zIndex: -1 }} />
        </div>
      </Reveal>
    </header>
  );
}

/* ---------------------------------------------------------------- Steps */
const STEPS: [string, string, string][] = [
  ['01', 'Open any product page', 'The extension reads fiber content, fabric weight, construction details, and the asking price, automatically.'],
  ['02', 'Rules score it', 'A transparent, auditable rubric scores materials, construction, and value. No black box. You can reproduce every number.'],
  ['03', 'You decide in seconds', 'One verdict, the evidence under it, and a cheaper alternative when one exists.'],
];
function Steps() {
  return (
    <section id="how" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px)' }}>
      <Reveal><div style={{ ...eyebrow, marginBottom: 16 }}>How it works</div></Reveal>
      <Reveal><h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 48px' }}>Three steps. Zero effort.</h2></Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {STEPS.map(([n, t, b], i) => (
          <Reveal key={n} delay={i * 0.08}>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 28, height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--accent)', marginBottom: 14 }}>{n}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>{t}</div>
              <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--fg-2)', lineHeight: 1.55 }}>{b}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Live demo */
function BigScore() {
  const { ref, value } = useCountUp(8.7);
  return (
    <span ref={ref} style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-score)', lineHeight: 1, color: 'var(--score-high)' }}>
      {value.toFixed(1)}
    </span>
  );
}
function LiveDemo() {
  const [tab, setTab] = useState('Score');
  const check = (color: string, t: string, ic: 'check' | 'alert') => (
    <span style={{ color, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <Icon name={ic} size={14} />
      {t}
    </span>
  );
  return (
    <section style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 420px)', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center' }}>
        <Reveal>
          <div>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Try it</div>
            <h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 20px' }}>This is the real thing.</h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--fg-2)', maxWidth: 440, lineHeight: 1.55 }}>
              The scorecard on the right is the actual extension UI: same components, same rubric, scoring a $29.90 Uniqlo tee. Click through the tabs.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              <Badge mono>100% Cotton</Badge>
              <Badge mono>Ring-spun</Badge>
              <Badge mono>185 GSM</Badge>
              <Badge tone="high">18% under comparable</Badge>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <GlassPanel strong padding="20px" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>AIRism Cotton Oversized T-Shirt</span>
              <VerdictPill verdict="worth" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <BigScore />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-3)' }}>/10 · worth the price?</span>
            </div>
            <Tabs tabs={['Score', 'Materials', 'Reviews']} active={tab} onChange={setTab} />
            {tab === 'Score' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <ScoreBar label="Materials" value={8.5} detail="100% ring-spun cotton" />
                <ScoreBar label="Construction" value={7.8} detail="Double-stitched hems and collar" />
                <ScoreBar label="Value" value={9.0} detail="18% under comparable products" />
              </div>
            )}
            {tab === 'Materials' && (
              <Card padding="0 16px">
                <CardRow label="Fiber" sub="Natural, breathable" value="Cotton" />
                <CardRow label="Yarn" value="Ring-spun" />
                <CardRow label="Weight" value="185 GSM" />
              </Card>
            )}
            {tab === 'Reviews' && (
              <div style={{ display: 'grid', gap: 8, fontSize: 'var(--text-sm)' }}>
                {check('var(--score-high)', 'Holds shape after repeated washes', 'check')}
                {check('var(--score-high)', 'True to size, soft hand-feel', 'check')}
                {check('var(--score-low)', 'Collar can stretch if hung wet', 'alert')}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>Explanation by AI · scoring is rules, not AI</div>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Ink band */
const AI_ROWS: [string, string, 'check' | 'x'][] = [
  ['Rules score it', 'Fiber, GSM, construction, origin, price vs. comparables, weighted and published.', 'check'],
  ['AI explains it', 'Turns the numbers into one honest paragraph. Cached per product, nearly free.', 'check'],
  ['AI never judges', 'No “our model thinks it’s a 7.” If you can’t audit it, we don’t ship it.', 'x'],
];
function InkBand() {
  return (
    <section id="method" className="miq-ink" style={{ padding: 'clamp(64px, 9vw, 96px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(32px, 5vw, 64px)' }}>
        <Reveal>
          <div>
            <div style={{ ...eyebrow, color: 'var(--accent-bright)', marginBottom: 16 }}>Transparency</div>
            <h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: 0, color: 'var(--fg-inverse)' }}>
              Transparent scoring.
              <br />
              AI only where it helps.
            </h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--fg-inverse-2)', maxWidth: 440, lineHeight: 1.6, margin: '20px 0 28px' }}>
              Every score comes from a published rubric: fiber quality, fabric weight, construction signals, price against comparables. AI never decides your score. It does two jobs only: reading messy product pages, and writing the plain-English explanation.
            </p>
            <Button variant="secondary" style={{ borderColor: 'var(--border-inverse-2)', color: 'var(--fg-inverse)' }}>Read the full methodology</Button>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: 'grid', gap: 12, alignContent: 'center' }}>
            {AI_ROWS.map(([t, b, ic]) => (
              <div key={t} style={{ background: 'var(--ink-1)', border: '1px solid var(--border-inverse)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', gap: 14 }}>
                <span style={{ color: ic === 'x' ? 'var(--score-low)' : 'var(--accent-bright)', display: 'flex', alignItems: 'flex-start', paddingTop: 3 }}>
                  <Icon name={ic} size={16} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--fg-inverse)' }}>{t}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse-2)', lineHeight: 1.5, marginTop: 4 }}>{b}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Verdicts */
function Verdicts() {
  return (
    <section style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px)', textAlign: 'center' }}>
      <Reveal><div style={{ ...eyebrow, marginBottom: 16 }}>Three possible answers</div></Reveal>
      <Reveal><h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 48px' }}>Worth it. Fair. Skip.</h2></Reveal>
      <Reveal>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <HangTag label="MERINO SWEATER" value={9.1} verdict="Worth it" details={[{ k: 'ASKING', v: '$120' }, { k: 'COMPARABLE', v: '$150–210' }]} style={{ transform: 'rotate(-2deg)' }} />
          <HangTag label="OXFORD SHIRT" value={6.4} verdict="Fair price" details={[{ k: 'ASKING', v: '$49.50' }, { k: 'COMPARABLE', v: '$45–60' }]} style={{ transform: 'translateY(16px)' }} />
          <HangTag label="ACRYLIC CARDIGAN" value={3.1} verdict="Skip this one" details={[{ k: 'ASKING', v: '$89' }, { k: 'COMPARABLE', v: '$25–40' }]} style={{ transform: 'rotate(2.5deg)' }} />
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Get Extension */
function GetExtension() {
  return (
    <section id="get" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(64px, 9vw, 104px) clamp(20px, 4vw, 40px)', textAlign: 'center' }}>
      <Reveal style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Available Now</div>
        <h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 14px' }}>Get it for free.</h2>
        <p style={{ color: 'var(--fg-2)', margin: '0 0 28px', fontSize: 'var(--text-md)', lineHeight: 1.55 }}>Works instantly on thousands of clothing stores, including Amazon, Uniqlo, H&M, and independent Shopify boutiques.</p>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
        >
          Add to Chrome — It's Free
        </Button>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */
const FOOTER_COLS: [string, string[]][] = [
  ['Product', ['Add to Chrome', 'Supported retailers', 'Changelog']],
  ['Trust', ['Methodology', 'How AI is used', 'Privacy']],
];
function Footer() {
  return (
    <footer className="miq-ink" style={{ padding: '64px clamp(20px, 4vw, 40px) 40px' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <Wordmark inverse size={18} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse-2)', marginTop: 10, maxWidth: 300 }}>Confidence before you buy. Free, no account, no tracking.</div>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {FOOTER_COLS.map(([h, links]) => (
              <div key={h} style={{ display: 'grid', gap: 8 }}>
                <div style={{ ...eyebrow, color: 'var(--fg-inverse-2)' }}>{h}</div>
                {links.map((l) => (
                  <a key={l} href="#" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)' }}>{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-inverse)', marginTop: 48, paddingTop: 20, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-inverse-2)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>© 2026 MaterialIQ</span>
          <span>Scores you can audit.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- Page */
export function Landing() {
  useSmoothScroll();
  const toGet = () => document.getElementById('get')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div>
      <a href="#main" className="miq-skip">Skip to content</a>
      <Nav onCta={toGet} />
      <main id="main">
        <Hero onCta={toGet} />
        <Marquee items={['Works with', 'UNIQLO', 'H&M', 'AMAZON', 'URBAN OUTFITTERS', 'EVERLANE', 'J.CREW', 'MORE SOON']} speed={26} />
        <Steps />
        <LiveDemo />
        <InkBand />
        <Verdicts />
        <GetExtension />
      </main>
      <Footer />
    </div>
  );
}
