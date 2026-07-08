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

  it('returns null when there is nothing to score', () => {
    const doc = docFrom('<html><body><h1>About us</h1><p>We sell things.</p></body></html>');
    expect(extractGeneric(doc, 'https://example.com/about')).toBeNull();
  });
});
