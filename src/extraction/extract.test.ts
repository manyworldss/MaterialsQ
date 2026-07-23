// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractGeneric } from './retailers/generic';
import { extractProduct } from './index';
import { parseComposition, parseGsm } from './parse';

function docFrom(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('composition parsing', () => {
  it('parses a single 100% fiber', () => {
    expect(parseComposition('100% Ring-Spun Cotton')).toEqual([{ fiber: 'cotton', percent: 100, raw: '100% Ring-Spun Cotton' }]);
  });
  it('parses a blend and merges duplicates', () => {
    const parts = parseComposition('60% Cotton, 40% Polyester');
    expect(parts.find((p) => p.fiber === 'cotton')?.percent).toBe(60);
    expect(parts.find((p) => p.fiber === 'polyester')?.percent).toBe(40);
  });
  it('prefers organic cotton over plain cotton', () => {
    expect(parseComposition('100% Organic Cotton')[0].fiber).toBe('organic-cotton');
  });
  it('parses GSM in several notations', () => {
    expect(parseGsm('Fabric weight: 185 GSM')).toBe(185);
    expect(parseGsm('220 g/m²')).toBe(220);
    expect(parseGsm('nothing here')).toBeNull();
  });
});

describe('extractGeneric — markup shapes', () => {
  it('reads a schema.org Product JSON-LD page', () => {
    const doc = docFrom(`<html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Supima Cotton Crew Neck T-Shirt',
        material: '100% Supima Cotton',
        offers: { '@type': 'Offer', price: '19.90', priceCurrency: 'USD' },
      })}</script></head><body><h1>ignored</h1></body></html>`);
    const p = extractGeneric(doc, 'https://www.uniqlo.com/us/en/products/E123')!;
    expect(p).not.toBeNull();
    expect(p.price).toBe(19.9);
    expect(p.composition[0].fiber).toBe('pima-cotton');
    expect(p.category).toBe('tshirt');
  });

  it('reads OpenGraph tags + a spec table when no JSON-LD', () => {
    const doc = docFrom(`<html><head>
      <meta property="og:title" content="Heavyweight Pocket Tee" />
      <meta property="product:price:amount" content="34.00" />
      <meta property="product:price:currency" content="USD" />
      </head><body>
      <table><tr><th>Material</th><td>100% Combed Cotton</td></tr>
      <tr><th>Weight</th><td>240 GSM</td></tr>
      <tr><th>Construction</th><td>Double-stitched, side-seamed</td></tr></table>
      </body></html>`);
    const p = extractGeneric(doc, 'https://example.com/p/1')!;
    expect(p.title).toBe('Heavyweight Pocket Tee');
    expect(p.price).toBe(34);
    expect(p.composition[0].fiber).toBe('combed-cotton');
    expect(p.gsm).toBe(240);
    expect(p.constructionSignals.length).toBeGreaterThan(0);
  });

  it('ignores composition from a "you may also like" recommendations section', () => {
    // The main product is cotton; a recommended item is polyester. We must grade
    // the cotton, never let the recommendation's fabric leak in.
    const doc = docFrom(`<html><head>
      <meta property="og:title" content="Classic Cotton Tee" />
      <meta property="product:price:amount" content="25.00" />
      </head><body><main>
        <h1>Classic Cotton Tee</h1>
        <div class="product-details">
          <table><tr><th>Material</th><td>100% Cotton</td></tr>
          <tr><th>Weight</th><td>180 GSM</td></tr></table>
        </div>
        <section class="you-may-also-like" aria-label="Recommended products">
          <h2>You may also like</h2>
          <div class="rec-card"><p>Material: 100% Polyester</p><p>90 GSM</p></div>
        </section>
      </main></body></html>`);
    const p = extractGeneric(doc, 'https://example.com/p/cotton-tee')!;
    expect(p.composition).toEqual([{ fiber: 'cotton', percent: 100, raw: '100% Cotton' }]);
    expect(p.composition.some((c) => c.fiber === 'polyester')).toBe(false);
    expect(p.gsm).toBe(180); // the main product's weight, not the recommendation's 90
  });

  it('trusts an adapter-provided composition over a page recommendation (H&M bug)', () => {
    // Reproduces the live H&M failure: the adapter reads the true composition
    // ("Polyester 100%"), but the page also renders a recommended product whose
    // fabric ("92% Cotton") is NOT inside a recognizable "recommend"/"related"
    // container. The provided composition must win — we must not dilute it with a
    // broad DOM scan.
    const doc = docFrom(`<html><head><meta property="og:title" content="Mesh Vest Top" /></head>
      <body><main>
        <h1>Mesh Vest Top</h1>
        <div class="rec-card"><p>Cotton Twill Cap 92% Cotton, 8% Elastane</p></div>
      </main></body></html>`);
    const p = extractGeneric(doc, 'https://www2.hm.com/en_us/productpage.1.html', { title: 'Mesh Vest Top', priceText: '14.99', specText: 'Polyester 100%' })!;
    expect(p.composition).toEqual([{ fiber: 'polyester', percent: 100, raw: 'Polyester 100%' }]);
    expect(p.composition.some((c) => c.fiber === 'cotton')).toBe(false);
  });

  it('falls back to inline SPA state script for composition', () => {
    const doc = docFrom(`<html><head>
      <meta property="og:title" content="AIRism Cotton Oversized T-Shirt" />
      </head><body>
      <span class="price">$29.90</span>
      <script>window.__PRELOADED_STATE__ = ${JSON.stringify({
        product: { composition: '100% Cotton', weight: '185 gsm', yarn: 'ring-spun' },
      })};</script>
      </body></html>`);
    const p = extractGeneric(doc, 'https://www.uniqlo.com/us/en/products/E459565')!;
    expect(p.composition[0].fiber).toBe('cotton');
    expect(p.gsm).toBe(185);
    expect(p.yarn).toBe('ring-spun');
  });

  it('reads a real Uniqlo state blob (og:title + prices.base.value + composition)', () => {
    // Shape verified against the live US PDP E422992-000 (no JSON-LD).
    const blob =
      '{"product":{"name":"Crew Neck T-Shirt","prices":{"base":{"currency":{"code":"USD","symbol":"$"},"value":24.9},"promo":null},"composition":"100% Cotton\\u003cbr>\\u003cbr>Imported"}}';
    const doc = docFrom(`<html><head>
      <meta property="og:title" content="Unisex Crew Neck T-Shirt | UNIQLO US" />
      </head><body><script>window.__PRELOADED_STATE__ = ${blob};</script></body></html>`);
    const p = extractProduct(doc, 'https://www.uniqlo.com/us/en/products/E422992-000/00')!;
    expect(p).not.toBeNull();
    expect(p.title).toBe('Unisex Crew Neck T-Shirt');
    expect(p.price).toBe(24.9);
    expect(p.composition).toEqual([{ fiber: 'cotton', percent: 100, raw: '100% Cotton' }]);
    expect(p.category).toBe('tshirt');
    expect(p.gsm).toBeNull();
  });

  it('reads an Amazon PDP (productTitle + a-offscreen price + detail bullets)', () => {
    const doc = docFrom(`<html><body>
      <h1 id="productTitle">Men's Short-Sleeve Crew T-Shirt</h1>
      <div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">$24.99</span></span></div>
      <div id="detailBullets_feature_div"><ul>
        <li><span class="a-text-bold">Fabric type</span><span>100% Cotton</span></li>
        <li><span class="a-text-bold">Care instructions</span><span>Machine Wash</span></li>
      </ul></div>
    </body></html>`);
    const p = extractProduct(doc, 'https://www.amazon.com/dp/B00TESTASIN')!;
    expect(p.title).toBe("Men's Short-Sleeve Crew T-Shirt");
    expect(p.price).toBe(24.99);
    expect(p.composition[0].fiber).toBe('cotton');
    expect(p.category).toBe('tshirt');
  });

  it('reads an H&M SPA (og:title + blob price + fiber-first composition)', () => {
    const blob = '{"product":{"name":"Regular Fit T-shirt","price":{"value":9.99,"currency":"USD"},"composition":"Cotton 60%, Polyester 40%"}}';
    const doc = docFrom(`<html><head>
      <meta property="og:title" content="Regular Fit T-shirt | H&M US" />
      <meta property="product:price:amount" content="9.99" />
      </head><body><script>window.__INITIAL_STATE__ = ${blob};</script></body></html>`);
    const p = extractProduct(doc, 'https://www2.hm.com/en_us/productpage.1234567.html')!;
    expect(p.title).toBe('Regular Fit T-shirt');
    expect(p.price).toBe(9.99);
    expect(p.composition.find((c) => c.fiber === 'cotton')?.percent).toBe(60);
    expect(p.composition.find((c) => c.fiber === 'polyester')?.percent).toBe(40);
    expect(p.category).toBe('tshirt');
  });

  it('parseComposition handles fiber-first order', () => {
    const parts = parseComposition('Cotton 100%');
    expect(parts).toEqual([{ fiber: 'cotton', percent: 100, raw: 'Cotton 100%' }]);
  });

  it('returns null when there is nothing to score', () => {
    const doc = docFrom('<html><body><h1>About us</h1><p>We sell things.</p></body></html>');
    expect(extractGeneric(doc, 'https://example.com/about')).toBeNull();
  });
});

import * as fs from 'fs';
import * as path from 'path';
import { extractAmazon } from './retailers/amazon';
import { extractHM } from './retailers/hm';

describe('Real Retailer Calibrations', () => {
  it('extracts correctly from the Amazon HTML snapshot', () => {
    const htmlPath = path.resolve(__dirname, '../../tmp/html files/BYLT Mens Drop-Cut Men\'s T Shirt, Slim Fit Plain Tshirts for Men, Drop Cut Basic Crewneck Tee, Wrinkle Resistant, Stretch Fit – White, XL _ Amazon.com.html');
    if (!fs.existsSync(htmlPath)) {
      console.warn('Amazon HTML not found at', htmlPath);
      return;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const doc = docFrom(html);
    const p = extractAmazon(doc, 'https://www.amazon.com/dp/B08G9P3XX3');
    
    expect(p).not.toBeNull();
    console.log('Amazon Product:', JSON.stringify(p, null, 2));
    
    if (p) {
      expect(p.title).toContain('BYLT Mens Drop-Cut');
      expect(p.price).toBeGreaterThan(0);
      expect(p.composition.length).toBeGreaterThan(0);
    }
  });

  it('extracts correctly from the H&M HTML snapshot', () => {
    const htmlPath = path.resolve(__dirname, '../../tmp/html files/Men’s Dark blue_St. Ives Hotel Relaxed-Fit Printed T-Shirt _ H&M US.html');
    if (!fs.existsSync(htmlPath)) {
      console.warn('H&M HTML not found at', htmlPath);
      return;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const doc = docFrom(html);
    const p = extractHM(doc, 'https://www2.hm.com/en_us/productpage.12345.html');
    
    expect(p).not.toBeNull();
    
    if (p) {
      expect(p.title).toContain('St. Ives Hotel');
      expect(p.price).toBeGreaterThan(0);
      expect(p.composition.length).toBeGreaterThan(0);
    }
  });
});
