/* Sample products for testing the engine without a live page.
   The popup falls back to SAMPLE_TEE when opened off a supported retailer,
   so the UI is always demoable. */

import type { Product } from './types';

export const SAMPLE_TEE: Product = {
  title: 'AIRism Cotton Oversized T-Shirt',
  retailer: 'www.uniqlo.com',
  url: 'https://www.uniqlo.com/us/en/products/E459565-000',
  price: 29.9,
  currency: 'USD',
  category: 'tshirt',
  composition: [{ fiber: 'cotton', percent: 100, raw: '100% Ring-Spun Cotton' }],
  gsm: 185,
  yarn: 'ring-spun',
  origin: 'Vietnam',
  constructionSignals: ['Double-stitched hems and collar', 'Side-seamed'],
  reviews: {
    count: 1847,
    pros: ['Holds shape after repeated washes', 'True to size, soft hand-feel'],
    cons: ['Collar can stretch if hung wet'],
    durabilitySignal: 4.1,
  },
  extractionConfidence: 0.9,
  notes: [],
};

export const SAMPLE_KNIT: Product = {
  title: 'Merino Crew Sweater',
  retailer: 'www.uniqlo.com',
  url: 'https://www.uniqlo.com/us/en/products/E123456-000',
  price: 95.0,
  currency: 'USD',
  category: 'knit',
  composition: [{ fiber: 'merino', percent: 100, raw: '100% Extra-Fine Merino' }],
  gsm: null,
  yarn: 'unknown',
  origin: null,
  constructionSignals: ['Fully-fashioned knit', 'Linked seams'],
  extractionConfidence: 0.8,
  notes: ['Fabric weight (GSM) not published for knitwear'],
};

export const SAMPLE_ACTIVEWEAR: Product = {
  title: 'Ultra Performance Running Tee',
  retailer: 'www.example-sport.com',
  url: 'https://example.com/p/run-tee',
  price: 34.9,
  currency: 'USD',
  category: 'tshirt',
  composition: [
    { fiber: 'polyester', percent: 88, raw: '88% Polyester' },
    { fiber: 'elastane', percent: 12, raw: '12% Elastane' },
  ],
  gsm: 140,
  yarn: 'unknown',
  origin: null,
  constructionSignals: ['Flatlock seams'],
  extractionConfidence: 0.85,
  notes: [],
};

export const SAMPLE_BAD_TEE: Product = {
  title: 'Fashion Logo Tee',
  retailer: 'www.example-fastfashion.com',
  url: 'https://example.com/p/1',
  price: 45.0,
  currency: 'USD',
  category: 'tshirt',
  composition: [
    { fiber: 'polyester', percent: 60, raw: '60% Polyester' },
    { fiber: 'cotton', percent: 40, raw: '40% Cotton' },
  ],
  gsm: 135,
  yarn: 'open-end',
  origin: null,
  constructionSignals: [],
  extractionConfidence: 0.7,
  notes: [],
};
