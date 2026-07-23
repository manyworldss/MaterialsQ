import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Badge, Button, Card, CardRow, GlassPanel, HangTag, Marquee, ScoreBar, VerdictPill } from '@ds';
import { analyze, type Fiber, type Product } from '@engine';
import { parseComposition } from '@extraction';
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
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--accent)',
};

function Icon({ name, size = 16 }: { name: 'check' | 'alert' | 'x' | 'sparkles' | 'sliders' | 'search'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'check') return (<svg {...p}><path d="M4 12.5l5 5 11-11" /></svg>);
  if (name === 'x') return (<svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
  if (name === 'sparkles') return (<svg {...p}><path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" /></svg>);
  if (name === 'sliders') return (<svg {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>);
  if (name === 'search') return (<svg {...p}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>);
  return (<svg {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></svg>);
}

function Wordmark({ size = 16, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <span style={{ ...displayType, fontSize: size, letterSpacing: '0.02em', color: inverse ? 'var(--fg-inverse)' : 'var(--fg-1)' }}>
      Material<span style={{ color: inverse ? 'var(--accent-bright)' : 'var(--accent)' }}>IQ</span>
    </span>
  );
}

/* ---------------------------------------------------------------- Floating Pill Nav */
function Nav({ onCta }: { onCta: () => void }) {
  return (
    <header className="miq-pill-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Wordmark size={15} />
        <span style={{ height: 12, width: 1, background: 'var(--border-1)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--score-high)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--score-high)' }} />
          v1.0 Live
        </span>
      </div>
      <div className="nav-links">
        <a className="miq-navlink" href="#lab">Material Lab</a>
        <a className="miq-navlink" href="#deconstruct">Deconstruct</a>
        <a className="miq-navlink" href="#matrix">Fiber Guide</a>
        <a className="miq-navlink" href="#method">Transparency</a>
      </div>
      <Button size="sm" onClick={onCta}>Get Extension</Button>
    </header>
  );
}

/* ---------------------------------------------------------------- Hero */
function Hero({ onCta }: { onCta: () => void }) {
  return (
    <section className="hero-grid" style={{ maxWidth: PAGE, margin: '0 auto', padding: '150px clamp(20px, 4vw, 40px) 72px', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center' }}>
      <div>
        <Reveal onMount><div style={{ ...eyebrow, marginBottom: 20 }}>Objective Garment Intelligence · Beta</div></Reveal>
        <Reveal delay={0.06} onMount>
          <h1 style={{ ...displayType, fontSize: 'clamp(44px, 7.5vw, 76px)', margin: 0, textTransform: 'uppercase' }}>
            Know what it's
            <br />
            <span style={{ color: 'var(--accent)' }}>really worth.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12} onMount>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--fg-2)', maxWidth: 500, margin: '24px 0 32px', lineHeight: 1.55 }}>
            MaterialIQ deconstructs fiber blends, fabric weight (GSM), stitching cues, and price against comparables — giving you an unsparing, auditable score before you hit buy.
          </p>
        </Reveal>
        <Reveal delay={0.18} onMount>
          <div className="hero-cta-group" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' })}>
              Launch Material Lab ↓
            </Button>
            <Button size="lg" variant="secondary" onClick={onCta}>
              Add to Chrome, Free
            </Button>
          </div>
        </Reveal>
        <Reveal delay={0.24} onMount>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-3)', marginTop: 20 }}>
            Deterministic rule scoring · Zero brand sponsorships · 100% transparent
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.16} onMount>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', minHeight: 340 }}>
          <HangTag
            label="LUXE CASHMERE MOCKNECK"
            value={9.2}
            verdict="Worth it"
            size="lg"
            countUp
            details={[
              { k: 'FIBER', v: '100% Grade-A Cashmere' },
              { k: 'DENSITY', v: '2-Ply 12-Gauge' },
              { k: 'ASKING', v: '$148.00' },
              { k: 'COMPARABLE', v: '$180–260' },
            ]}
            style={{ transform: 'rotate(2deg)', boxShadow: 'var(--shadow-pop)' }}
          />
          <HangTag
            label="FAST-FASHION CARDIGAN"
            value={3.2}
            verdict="Skip this one"
            details={[
              { k: 'FIBER', v: '70% Acrylic, 30% Poly' },
              { k: 'ASKING', v: '$89.00' },
              { k: 'BRAND PREMIUM', v: '+$52 Markup' },
            ]}
            style={{ transform: 'rotate(-6deg) translate(-28px, 60px)', zIndex: -1 }}
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Deconstruction Visualizer */
const HOTSPOTS = [
  {
    id: 1,
    title: '1. Fiber Composition',
    x: '25%',
    y: '22%',
    tag: 'FIBER',
    detail: 'Grade-A Extra Fine Merino Wool vs 70% Poly/Acrylic blend.',
    score: '+3.5 PTS',
    desc: 'Natural long-staple fibers resist pilling, regulate temperature, and last 5x longer than synthetic acrylic.',
  },
  {
    id: 2,
    title: '2. Collar & Hem Stitching',
    x: '50%',
    y: '14%',
    tag: 'CONSTRUCTION',
    detail: 'Double-stitched ribbed collar & side-seamed body.',
    score: '+2.0 PTS',
    desc: 'Tubular seamless tees sag after 3 washes. Side-seamed construction ensures structural stability after laundering.',
  },
  {
    id: 3,
    title: '3. Fabric Weight (GSM)',
    x: '75%',
    y: '48%',
    tag: 'DENSITY',
    detail: '185–240 GSM Heavyweight Jersey.',
    score: '+2.5 PTS',
    desc: 'GSM measures fabric mass per square meter. Higher GSM means richer drape, opacity, and shape retention.',
  },
  {
    id: 4,
    title: '4. Asking vs Substance Price',
    x: '40%',
    y: '78%',
    tag: 'VALUE',
    detail: 'Asking: $45 | Substance Floor: $52',
    score: '+1.5 PTS',
    desc: 'Calculates raw material cost + baseline construction to detect if you are paying for quality or just a brand label.',
  },
];

function DeconstructGarment() {
  const [active, setActive] = useState(1);
  const current = HOTSPOTS.find((h) => h.id === active) || HOTSPOTS[0];

  return (
    <section id="deconstruct" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px)' }}>
      <Reveal><div style={{ ...eyebrow, marginBottom: 16 }}>Garment Deconstruction</div></Reveal>
      <Reveal><h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 40px' }}>What makes a 9.0 vs a 3.0?</h2></Reveal>

      <div className="lab-grid">
        <Reveal>
          <div className="hotspot-card" style={{ padding: 40, height: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 280, height: 300, border: '2px dashed var(--border-2)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Wordmark size={20} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 8 }}>Interactive Inspection Specimen</div>

              {HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActive(h.id)}
                  className={`hotspot-btn ${active === h.id ? 'active' : ''}`}
                  style={{ left: h.x, top: h.y }}
                  title={h.title}
                >
                  {h.id}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassPanel strong padding="32px" style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge tone="accent" mono>{current.tag}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--score-high)', fontSize: 'var(--text-md)' }}>
                {current.score}
              </span>
            </div>

            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>{current.title}</h3>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--fg-1)' }}>{current.detail}</div>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--fg-2)', lineHeight: 1.6, margin: 0 }}>{current.desc}</p>

            <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 16, display: 'flex', gap: 8 }}>
              {HOTSPOTS.map((h) => (
                <Button
                  key={h.id}
                  size="sm"
                  variant={active === h.id ? 'primary' : 'ghost'}
                  onClick={() => setActive(h.id)}
                >
                  Pt {h.id}
                </Button>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}

type ItemCategory = 'tshirt' | 'knit' | 'unknown';

interface PresetItem {
  key: string;
  name: string;
  price: number;
  category: ItemCategory;
  gsm: number;
  fibers: { fiber: Fiber; percent: number; raw: string }[];
  construction: string[];
}

const PRESETS: PresetItem[] = [
  {
    key: 'uniqlo',
    name: 'Uniqlo AIRism Oversized Tee',
    price: 29.9,
    category: 'tshirt',
    gsm: 185,
    fibers: [{ fiber: 'cotton', percent: 100, raw: '100% Ring-Spun Cotton' }],
    construction: ['Double-stitched hems and collar', 'Side-seamed'],
  },
  {
    key: 'merino',
    name: '100% Extra-Fine Merino Sweater',
    price: 95.0,
    category: 'knit',
    gsm: 240,
    fibers: [{ fiber: 'merino', percent: 100, raw: '100% Extra-Fine Merino Wool' }],
    construction: ['Fully-fashioned knit', 'Linked seams'],
  },
  {
    key: 'cashmere',
    name: 'Luxury Grade-A Cashmere Crew',
    price: 180.0,
    category: 'knit',
    gsm: 260,
    fibers: [{ fiber: 'cashmere', percent: 100, raw: '100% Mongolian Cashmere' }],
    construction: ['Fully-fashioned knit', 'Linked seams', 'Reinforced stress points'],
  },
  {
    key: 'fastfashion',
    name: 'Fast-Fashion Acrylic Logo Hoodie',
    price: 89.0,
    category: 'tshirt',
    gsm: 140,
    fibers: [
      { fiber: 'acrylic', percent: 70, raw: '70% Acrylic' },
      { fiber: 'polyester', percent: 30, raw: '30% Polyester' },
    ],
    construction: [],
  },
  {
    key: 'activewear',
    name: 'Pro Performance Athletic Short',
    price: 44.0,
    category: 'tshirt',
    gsm: 160,
    fibers: [
      { fiber: 'polyester', percent: 88, raw: '88% Recycled Polyester' },
      { fiber: 'elastane', percent: 12, raw: '12% Elastane' },
    ],
    construction: ['Flatlock seams'],
  },
];

function MaterialLab() {
  const [selectedPreset, setSelectedPreset] = useState('uniqlo');
  const [urlInput, setUrlInput] = useState('');
  const [price, setPrice] = useState(29.9);
  const [category, setCategory] = useState<ItemCategory>('tshirt');
  const [gsm, setGsm] = useState(185);
  const [primaryFiber, setPrimaryFiber] = useState<Fiber>('cotton');
  const [primaryPct, setPrimaryPct] = useState(100);
  const [secondaryFiber, setSecondaryFiber] = useState<Fiber>('polyester');
  const [secondaryPct, setSecondaryPct] = useState(0);
  const [constructionSignals, setConstructionSignals] = useState<string[]>(['Double-stitched hems and collar', 'Side-seamed']);

  const handleParseUrlOrText = (raw: string) => {
    if (!raw.trim()) return;
    setSelectedPreset('custom');

    // Price extraction ($xx.xx or $xx)
    const priceMatch = raw.match(/\$\s*(\d+(\.\d{1,2})?)/);
    if (priceMatch) {
      setPrice(parseFloat(priceMatch[1]));
    }

    // GSM extraction (e.g. 185 gsm)
    const gsmMatch = raw.match(/(\d{3})\s*gsm/i);
    if (gsmMatch) {
      setGsm(parseInt(gsmMatch[1], 10));
    }

    // Category detection
    if (/sweater|knit|cardigan|crewneck/i.test(raw)) setCategory('knit');
    else if (/tee|t-shirt|shirt|hoodie|top/i.test(raw)) setCategory('tshirt');

    // Parse fibers using real extraction engine parser!
    const parts = parseComposition(raw);
    if (parts.length > 0) {
      setPrimaryFiber(parts[0].fiber);
      setPrimaryPct(parts[0].percent);
      if (parts[1]) {
        setSecondaryFiber(parts[1].fiber);
        setSecondaryPct(parts[1].percent);
      } else {
        setSecondaryPct(0);
      }
    }

    // Construction signals detection
    const foundSignals: string[] = [];
    if (/double-stitched|double stitched/i.test(raw)) foundSignals.push('Double-stitched hems and collar');
    if (/side-seamed|side seamed/i.test(raw)) foundSignals.push('Side-seamed');
    if (/fully-fashioned|fully fashioned/i.test(raw)) foundSignals.push('Fully-fashioned knit');
    if (/linked seams|linked/i.test(raw)) foundSignals.push('Linked seams');
    if (/flatlock/i.test(raw)) foundSignals.push('Flatlock seams');
    if (foundSignals.length > 0) {
      setConstructionSignals(foundSignals);
    }
  };

  const loadPreset = (presetKey: string) => {
    const p = PRESETS.find((pr) => pr.key === presetKey);
    if (!p) return;
    setSelectedPreset(presetKey);
    setPrice(p.price);
    setCategory(p.category);
    setGsm(p.gsm);
    setPrimaryFiber(p.fibers[0]?.fiber || 'cotton');
    setPrimaryPct(p.fibers[0]?.percent || 100);
    if (p.fibers[1]) {
      setSecondaryFiber(p.fibers[1].fiber);
      setSecondaryPct(p.fibers[1].percent);
    } else {
      setSecondaryPct(0);
    }
    setConstructionSignals(p.construction);
  };

  // Build live Product object
  const composition: { fiber: Fiber; percent: number; raw: string }[] = [];
  if (primaryPct > 0) {
    composition.push({ fiber: primaryFiber, percent: primaryPct, raw: `${primaryPct}% ${primaryFiber}` });
  }
  if (secondaryPct > 0) {
    composition.push({ fiber: secondaryFiber, percent: secondaryPct, raw: `${secondaryPct}% ${secondaryFiber}` });
  }

  const customProduct: Product = {
    title: 'Custom Inspection Item',
    retailer: 'Live Material Lab',
    url: 'https://materialiq.ai/lab',
    price,
    currency: 'USD',
    category,
    composition,
    gsm,
    yarn: primaryFiber === 'cotton' ? 'ring-spun' : 'unknown',
    origin: 'Vietnam',
    constructionSignals,
    extractionConfidence: 0.95,
    notes: [],
  };

  // Run pure deterministic scoring engine!
  const analysis = analyze(customProduct);
  const { ref, value } = useCountUp(analysis.overall);

  const toggleConstruction = (signal: string) => {
    if (constructionSignals.includes(signal)) {
      setConstructionSignals(constructionSignals.filter((s) => s !== signal));
    } else {
      setConstructionSignals([...constructionSignals, signal]);
    }
  };

  return (
    <section id="lab" style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)', padding: 'clamp(64px, 9vw, 96px) clamp(20px, 4vw, 40px)' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Interactive Material Laboratory</div>
            <h2 style={{ ...displayType, fontSize: 'clamp(32px, 5vw, 48px)', margin: '0 0 16px' }}>Test any garment spec live.</h2>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--fg-2)', lineHeight: 1.55, margin: 0 }}>
              Tweak the composition, fabric weight (GSM), asking price, and construction cues below. Watch the real <Wordmark size={18} /> engine recalculate scores in real time.
            </p>
          </div>
        </Reveal>

        {/* Link Garment / Paste Text Input Bar */}
        <Reveal>
          <div className="miq-search-bar">
            <span className="miq-search-icon">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              className="miq-search-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleParseUrlOrText(urlInput); }}
              placeholder="Paste product URL (Uniqlo, Everlane, Amazon, H&M) or specs (e.g. 100% Cashmere $148)..."
            />
            <button
              className="miq-search-btn"
              onClick={() => handleParseUrlOrText(urlInput)}
            >
              Analyze →
            </button>
          </div>
        </Reveal>

        {/* Preset Selector */}
        <Reveal>
          <div className="miq-preset-bar">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>Presets:</span>
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={selectedPreset === p.key ? 'primary' : 'secondary'}
                onClick={() => loadPreset(p.key)}
              >
                {p.name} (${p.price})
              </Button>
            ))}
          </div>
        </Reveal>

        <div className="lab-grid">
          {/* Controls Column */}
          <Reveal>
            <GlassPanel padding="28px" style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-1)', paddingBottom: 14 }}>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="sliders" size={18} /> Garment Specifications
                </span>
                <Badge mono>Live Inputs</Badge>
              </div>

              {/* Asking Price Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600 }}>Asking Price ($USD)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>${price.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={1}
                  value={price}
                  onChange={(e) => { setPrice(parseFloat(e.target.value)); setSelectedPreset('custom'); }}
                  className="miq-slider"
                />
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 8 }}>Garment Category</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(['tshirt', 'knit', 'unknown'] as ItemCategory[]).map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={category === cat ? 'primary' : 'ghost'}
                      onClick={() => { setCategory(cat); setSelectedPreset('custom'); }}
                    >
                      {cat.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Primary Fiber */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600 }}>Primary Fiber ({primaryPct}%)</span>
                  <select
                    className="miq-select"
                    value={primaryFiber}
                    onChange={(e) => { setPrimaryFiber(e.target.value as Fiber); setSelectedPreset('custom'); }}
                  >
                    <option value="cotton">Cotton</option>
                    <option value="merino">Merino Wool</option>
                    <option value="cashmere">Cashmere</option>
                    <option value="silk">Silk</option>
                    <option value="linen">Linen</option>
                    <option value="polyester">Polyester</option>
                    <option value="acrylic">Acrylic</option>
                  </select>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={primaryPct}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    setPrimaryPct(p);
                    setSecondaryPct(100 - p);
                    setSelectedPreset('custom');
                  }}
                  className="miq-slider"
                />
              </div>

              {/* Secondary Fiber */}
              {primaryPct < 100 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                    <span style={{ fontWeight: 600 }}>Secondary Fiber ({secondaryPct}%)</span>
                    <select
                      className="miq-select"
                      value={secondaryFiber}
                      onChange={(e) => { setSecondaryFiber(e.target.value as Fiber); setSelectedPreset('custom'); }}
                    >
                      <option value="polyester">Polyester</option>
                      <option value="acrylic">Acrylic</option>
                      <option value="elastane">Elastane</option>
                      <option value="cotton">Cotton</option>
                      <option value="nylon">Nylon</option>
                    </select>
                  </div>
                </div>
              )}

              {/* GSM Fabric Weight */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600 }}>Fabric Weight (GSM)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--fg-1)' }}>{gsm} GSM</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={350}
                  step={5}
                  value={gsm}
                  onChange={(e) => { setGsm(parseInt(e.target.value)); setSelectedPreset('custom'); }}
                  className="miq-slider"
                />
              </div>

              {/* Construction Signals */}
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 10 }}>Construction Signals</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    'Double-stitched hems and collar',
                    'Side-seamed',
                    'Fully-fashioned knit',
                    'Linked seams',
                    'Flatlock seams',
                    'Reinforced stress points',
                  ].map((sig) => (
                    <label key={sig} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={constructionSignals.includes(sig)}
                        onChange={() => { toggleConstruction(sig); setSelectedPreset('custom'); }}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {sig}
                    </label>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </Reveal>

          {/* Real-time Output Scorecard */}
          <Reveal delay={0.1}>
            <GlassPanel strong padding="28px" style={{ display: 'grid', gap: 20, boxShadow: 'var(--shadow-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{customProduct.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{customProduct.retailer}</div>
                </div>
                <VerdictPill verdict={analysis.verdict} />
              </div>

              {/* Overall Score Badge */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, background: 'var(--surface-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-1)' }}>
                <span ref={ref} style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--text-3xl)', lineHeight: 1, color: analysis.overall >= 7.5 ? 'var(--score-high)' : analysis.overall >= 5.0 ? 'var(--fg-1)' : 'var(--score-low)' }}>
                  {value.toFixed(1)}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>OVERALL SCORE / 10</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-2)', marginTop: 2 }}>{analysis.durabilityCaption}</div>
                </div>
              </div>

              {/* Score Factor Bars */}
              <div style={{ display: 'grid', gap: 12 }}>
                {analysis.factors.map((f) => (
                  <ScoreBar key={f.label} label={f.label} value={f.value} detail={f.detail} />
                ))}
              </div>

              {/* Brand Premium & Cost per wear */}
              <Card padding="16px">
                {analysis.brandPremium && (
                  <CardRow
                    label="Brand Premium"
                    sub={analysis.brandPremium.label}
                    value={`$${Math.round(analysis.brandPremium.premiumDollars)} markup`}
                  />
                )}
                {analysis.costPerWear && (
                  <CardRow
                    label="Est. Cost Per Wear"
                    sub={`${analysis.costPerWear.wears} wears over ${analysis.costPerWear.years} yrs`}
                    value={`$${analysis.costPerWear.perWear.toFixed(2)} / wear`}
                  />
                )}
                <CardRow
                  label="Durability Rating"
                  value={`${analysis.durabilityStars} / 5 Stars`}
                />
              </Card>

              {/* Verdict Summary Copy */}
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-2)', background: 'var(--accent-tint)', border: '1px solid var(--border-accent)', padding: '14px 16px', borderRadius: 'var(--radius-md)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Rubric Analysis: </span>
                {analysis.verdictCopy}
              </div>

              {/* Cheaper Alternative if available */}
              {analysis.alternative && (
                <div style={{ background: 'var(--score-high-tint)', border: '1px solid rgba(14,124,74,0.3)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--score-high)', textTransform: 'uppercase' }}>Cheaper Alternative Found</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{analysis.alternative.name} ({analysis.alternative.retailer})</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--score-high)' }}>
                    ${analysis.alternative.price}
                  </div>
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
                Deterministic Engine v{analysis.rubricVersion} · Analyzed in {analysis.analyzedMs}ms
              </div>
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Fiber Quality Matrix */
const FIBERS = [
  { name: 'Grade-A Cashmere', type: 'Natural', score: '9.8 / 10', feel: 'Ultra-Soft', warmth: 'High', pilling: 'Low-Med', tag: 'Luxury' },
  { name: 'Extra-Fine Merino', type: 'Natural', score: '9.2 / 10', feel: 'Soft & Springy', warmth: 'High', pilling: 'Low', tag: 'High-Value' },
  { name: 'Mulberry Silk', type: 'Natural', score: '9.4 / 10', feel: 'Smooth / Luster', warmth: 'Medium', pilling: 'None', tag: 'Luxury' },
  { name: 'Long-Staple Cotton', type: 'Natural', score: '8.5 / 10', feel: 'Crisp & Breathable', warmth: 'Medium', pilling: 'Low', tag: 'Essential' },
  { name: '100% French Linen', type: 'Natural', score: '8.8 / 10', feel: 'Textured / Airy', warmth: 'Cool', pilling: 'None', tag: 'Durable' },
  { name: 'Recycled Polyester', type: 'Synthetic', score: '4.5 / 10', feel: 'Synthetic', warmth: 'Trap Heat', pilling: 'High', tag: 'Activewear' },
  { name: '100% Acrylic', type: 'Synthetic', score: '2.5 / 10', feel: 'Scratchy', warmth: 'Low-Med', pilling: 'Extreme', tag: 'Skip' },
];

function FiberMatrix() {
  return (
    <section id="matrix" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(56px, 8vw, 88px) clamp(20px, 4vw, 40px)' }}>
      <Reveal><div style={{ ...eyebrow, marginBottom: 16 }}>Fiber Quality Index</div></Reveal>
      <Reveal><h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: '0 0 40px' }}>Not all materials are created equal.</h2></Reveal>

      <Reveal>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-1)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-card-2)', borderBottom: '1px solid var(--border-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                <th style={{ padding: '14px 18px' }}>Fiber Name</th>
                <th style={{ padding: '14px 18px' }}>Type</th>
                <th style={{ padding: '14px 18px' }}>Rubric Base Score</th>
                <th style={{ padding: '14px 18px' }}>Hand-Feel</th>
                <th style={{ padding: '14px 18px' }}>Pilling Risk</th>
                <th style={{ padding: '14px 18px' }}>Classification</th>
              </tr>
            </thead>
            <tbody>
              {FIBERS.map((f, i) => (
                <tr key={f.name} style={{ borderBottom: i === FIBERS.length - 1 ? 'none' : '1px solid var(--border-1)', fontSize: 'var(--text-sm)' }}>
                  <td style={{ padding: '16px 18px', fontWeight: 700 }}>{f.name}</td>
                  <td style={{ padding: '16px 18px', color: 'var(--fg-2)' }}>{f.type}</td>
                  <td style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: parseFloat(f.score) >= 8 ? 'var(--score-high)' : parseFloat(f.score) >= 5 ? 'var(--fg-1)' : 'var(--score-low)' }}>
                    {f.score}
                  </td>
                  <td style={{ padding: '16px 18px', color: 'var(--fg-2)' }}>{f.feel}</td>
                  <td style={{ padding: '16px 18px', color: 'var(--fg-2)' }}>{f.pilling}</td>
                  <td style={{ padding: '16px 18px' }}>
                    <Badge tone={parseFloat(f.score) >= 8 ? 'high' : parseFloat(f.score) < 4 ? 'low' : 'neutral'}>
                      {f.tag}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Ink Band (Methodology) */
const AI_ROWS: [string, string, 'check' | 'x'][] = [
  ['Rules score it', 'Fiber, GSM, construction, origin, price vs. comparables, weighted and published.', 'check'],
  ['AI explains it', 'Turns the raw numbers into one plain-English paragraph you can quickly digest.', 'check'],
  ['AI never judges', 'No black box “our model thinks it’s a 7.” Every score comes from open, published rules.', 'x'],
];

function InkBand() {
  return (
    <section id="method" className="miq-ink" style={{ padding: 'clamp(64px, 9vw, 96px) clamp(20px, 4vw, 40px)', background: 'var(--ink-0)' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(32px, 5vw, 64px)' }}>
        <Reveal>
          <div>
            <div style={{ ...eyebrow, color: 'var(--accent-bright)', marginBottom: 16 }}>Transparency</div>
            <h2 style={{ ...displayType, fontSize: 'var(--text-2xl)', margin: 0, color: 'var(--fg-inverse)' }}>
              Transparent scoring.
              <br />
              Zero black boxes.
            </h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--fg-inverse-2)', maxWidth: 440, lineHeight: 1.6, margin: '20px 0 28px' }}>
              Every score comes from a published, open rubric: fiber quality, fabric weight, construction signals, price against comparables. You can reproduce every single calculation.
            </p>
            <Button variant="secondary" style={{ borderColor: 'var(--border-inverse-2)', color: 'var(--fg-inverse)' }}>
              Audit Full Math Specs
            </Button>
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

/* ---------------------------------------------------------------- Get Extension */
function GetExtension() {
  return (
    <section id="get" style={{ maxWidth: PAGE, margin: '0 auto', padding: 'clamp(64px, 9vw, 104px) clamp(20px, 4vw, 40px)', textAlign: 'center' }}>
      <Reveal style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Available Free</div>
        <h2 style={{ ...displayType, fontSize: 'clamp(32px, 5vw, 48px)', margin: '0 0 16px' }}>Shop with confidence.</h2>
        <p style={{ color: 'var(--fg-2)', margin: '0 0 32px', fontSize: 'var(--text-md)', lineHeight: 1.55 }}>
          Works automatically on thousands of online stores including Uniqlo, Everlane, Amazon, J.Crew, H&M, and independent Shopify boutiques.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
        >
          Add MaterialIQ to Chrome — It's Free
        </Button>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */
function Footer() {
  return (
    <footer className="miq-ink" style={{ background: 'var(--ink-0)', borderTop: '1px solid var(--border-inverse)', padding: '64px clamp(20px, 4vw, 40px) 40px' }}>
      <div style={{ maxWidth: PAGE, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <Wordmark inverse size={20} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse-2)', marginTop: 10, maxWidth: 320, lineHeight: 1.5 }}>
              Objective quality & value analysis before you buy. Free, open, no accounts, no tracking.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ ...eyebrow, color: 'var(--fg-inverse-2)' }}>Product</div>
              <a href="#lab" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)', textDecoration: 'none' }}>Material Lab</a>
              <a href="#deconstruct" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)', textDecoration: 'none' }}>Garment Inspection</a>
              <a href="#matrix" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)', textDecoration: 'none' }}>Fiber Index</a>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ ...eyebrow, color: 'var(--fg-inverse-2)' }}>Trust</div>
              <a href="#method" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)', textDecoration: 'none' }}>Deterministic Rubric</a>
              <a href="#method" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-inverse)', textDecoration: 'none' }}>No Black Box AI</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-inverse)', marginTop: 48, paddingTop: 20, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fg-inverse-2)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>© 2026 MaterialIQ</span>
          <span>Open Scores · No Sponsorships</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- Main Page */
export function Landing() {
  useSmoothScroll();
  const toGet = () => document.getElementById('get')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div>
      <a href="#main" className="miq-skip">Skip to content</a>
      <Nav onCta={toGet} />
      <main id="main">
        <Hero onCta={toGet} />
        <Marquee items={['Works with', 'UNIQLO', 'H&M', 'AMAZON', 'URBAN OUTFITTERS', 'EVERLANE', 'J.CREW', 'SHOPIFY BOUTIQUES']} speed={26} />
        <DeconstructGarment />
        <MaterialLab />
        <FiberMatrix />
        <InkBand />
        <GetExtension />
      </main>
      <Footer />
    </div>
  );
}
