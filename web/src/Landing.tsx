import { useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Score, ScoreBar, VerdictPill } from '@ds';
import { analyze, SAMPLE_KNIT } from '@engine';
import { joinWaitlist } from './waitlist';
import { useReveal } from './useReveal';

function Wordmark({ size = 17 }: { size?: number }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.01em' }}>
      Material<span style={{ color: 'var(--accent-bright)' }}>IQ</span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--accent-bright)', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function LiveScorecard() {
  // Computed by the REAL engine — not a mockup. That's the second-read payoff.
  const a = useMemo(() => analyze(SAMPLE_KNIT), []);
  const factors = a.factors.filter((f) => f.key !== 'value').slice(0, 2).concat(a.factors.filter((f) => f.key === 'value'));
  return (
    <div style={{ justifySelf: 'end', width: '100%', maxWidth: 400, position: 'relative' }}>
      <Card glow padding="24px" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{a.product.title}</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>${a.product.price?.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--fg-3)', margin: '14px 0 8px' }}>Worth the price?</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Score value={a.overall} />
          <VerdictPill verdict={a.verdict} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {factors.map((f) => (
            <ScoreBar key={f.key} label={f.label} value={f.value} max={f.max} detail={f.detail} />
          ))}
        </div>
      </Card>
      <div style={{ marginTop: 12, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>
        Computed live · rubric {a.rubricVersion}
      </div>
    </div>
  );
}

function Waitlist() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async () => {
    if (!valid) return;
    setState('sending');
    setState((await joinWaitlist(email)) ? 'done' : 'error');
  };

  return (
    <section id="waitlist" style={{ borderTop: '1px solid var(--border-1)', padding: '96px 48px 104px', textAlign: 'center' }}>
      <div className="reveal" style={{ maxWidth: 540, margin: '0 auto' }}>
        <Eyebrow>Beta access</Eyebrow>
        <h2 style={{ margin: '0 0 12px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', textWrap: 'balance' }}>Get in before it's public</h2>
        <p style={{ color: 'var(--fg-2)', margin: '0 0 28px', fontSize: 'var(--text-md)' }}>
          Beta opens on Uniqlo, H&amp;M, and Amazon — t-shirts first. We'll email you when it's your turn.
        </p>
        {state === 'done' ? (
          <div style={{ color: 'var(--score-high)', fontWeight: 600, fontSize: 'var(--text-md)' }}>You're on the list. We'll be in touch.</div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', maxWidth: 440, margin: '0 auto' }}
          >
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Button size="lg" disabled={!valid || state === 'sending'}>
              {state === 'sending' ? 'Joining…' : 'Join'}
            </Button>
          </form>
        )}
        {state === 'error' && <div style={{ color: 'var(--score-low)', fontSize: 'var(--text-sm)', marginTop: 12 }}>Connection failed. Please try again.</div>}
      </div>
    </section>
  );
}

const STEPS: [string, string, string][] = [
  ['01', 'Reads the label for you', 'Fiber content, fabric weight, and construction cues — extracted from the page the moment it loads.'],
  ['02', 'Scores it transparently', 'A rule-based rubric you can audit. No black box — every score traces to the methodology page.'],
  ['03', 'Gives you the verdict', 'Worth it, fair, or skip. And when it’s skip, we show you the better alternative.'],
];

export function Landing() {
  useReveal();
  const scrollToWaitlist = () => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="miq-grain">
      <header className="miq-nav">
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', maxWidth: 1180, margin: '0 auto' }}>
          <Wordmark />
          <div style={{ display: 'flex', gap: 30, alignItems: 'center', fontSize: 'var(--text-sm)' }}>
            <a className="miq-navlink" href="#how">How it works</a>
            <a className="miq-navlink" href="#">Methodology</a>
            <a className="miq-navlink" href="#waitlist">Pricing</a>
            <Button size="sm" onClick={scrollToWaitlist}>Add to Chrome</Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="miq-hero" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center', padding: '104px 48px 112px', maxWidth: 1180, margin: '0 auto', boxSizing: 'border-box' }}>
          <div>
            <div className="reveal">
              <Badge tone="accent" style={{ marginBottom: 22 }}>Free browser extension</Badge>
            </div>
            <h1 className="reveal" style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 800, lineHeight: 'var(--leading-tight)', letterSpacing: '-0.02em', textWrap: 'balance', transitionDelay: '60ms' }}>
              Know what it's worth
              <br />
              before you buy it.
            </h1>
            <p className="reveal" style={{ fontSize: 'var(--text-lg)', color: 'var(--fg-2)', maxWidth: 452, margin: '22px 0 30px', lineHeight: 'var(--leading-body)', transitionDelay: '120ms' }}>
              MaterialIQ reads the fabric, the stitching, and the price — then tells you, in plain English, whether to buy it or skip it.
            </p>
            <div className="reveal" style={{ display: 'flex', gap: 12, alignItems: 'center', transitionDelay: '180ms' }}>
              <Button size="lg" onClick={scrollToWaitlist}>Add to Chrome — it's free</Button>
              <Button size="lg" variant="ghost">Read the methodology</Button>
            </div>
            <div className="reveal" style={{ marginTop: 26, fontSize: 'var(--text-xs)', color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', transitionDelay: '240ms' }}>
              Transparent scoring. AI only where it helps.
            </div>
          </div>
          <div className="reveal" style={{ transitionDelay: '160ms' }}>
            <LiveScorecard />
          </div>
        </section>

        <section id="how" style={{ borderTop: '1px solid var(--border-1)', background: 'var(--bg-1)', padding: '88px 48px 96px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 64, alignItems: 'start' }}>
            <div className="reveal">
              <Eyebrow>Method</Eyebrow>
              <h2 style={{ margin: '0 0 14px', fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 'var(--leading-tight)', textWrap: 'balance' }}>
                Three answers,
                <br />
                one glance.
              </h2>
              <p style={{ color: 'var(--fg-2)', margin: '0 0 24px', maxWidth: 320 }}>Every score is reproducible. Read the rubric and you can compute it yourself — that's the bar.</p>
              <Button variant="secondary" size="md">Read the methodology</Button>
            </div>
            <div>
              {STEPS.map(([n, t, d], i) => (
                <article
                  key={n}
                  className="miq-step reveal"
                  style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 8, alignItems: 'baseline', padding: '26px 0', borderTop: '1px solid var(--border-1)', transitionDelay: `${i * 90}ms` }}
                >
                  <div className="miq-step-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--fg-3)' }}>{n}</div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 'var(--text-lg)', fontWeight: 700 }}>{t}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--fg-2)', maxWidth: 480, lineHeight: 'var(--leading-body)' }}>{d}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Waitlist />
      </main>

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', fontSize: 'var(--text-xs)', color: 'var(--fg-3)', borderTop: '1px solid var(--border-1)', maxWidth: 1180, margin: '0 auto', boxSizing: 'border-box' }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>© 2026 MaterialIQ</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a className="miq-navlink" href="#">Privacy</a>
          <a className="miq-navlink" href="#">Methodology</a>
          <a className="miq-navlink" href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}
