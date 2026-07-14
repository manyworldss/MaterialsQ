import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { extractAmazon } from '../src/extraction/retailers/amazon.ts';
import { extractHM } from '../src/extraction/retailers/hm.ts';
// need to run this through ts-node or vitest. Let's just create a vitest file instead.
