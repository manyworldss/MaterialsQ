/* Generates the MaterialIQ toolbar icons: the brand hang-tag mark in azure, the
   signature element of the design system (the score is shown on a garment tag).
   Anti-aliased via 4x supersampling. Transparent background so it reads on both
   light and dark Chrome toolbars. Outputs public/icons/icon-{16,32,48,128}.png. */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const AZURE = [0, 119, 230]; // #0077E6
const SS = 4; // supersampling factor for smooth edges

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* Signed-distance test for a rounded rectangle; <= 0 is inside. */
function insideRoundRect(px, py, x0, y0, x1, y1, r) {
  const hw = (x1 - x0) / 2;
  const hh = (y1 - y0) / 2;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  return d <= 0;
}

/* Coverage 0..1 of the hang-tag shape (tag body minus punched eyelet) at pixel. */
function coverage(x, y, D) {
  // Portrait tag, slightly inset. Eyelet punched near the top-center.
  const x0 = 0.28 * D;
  const x1 = 0.72 * D;
  const y0 = 0.15 * D;
  const y1 = 0.85 * D;
  const r = 0.09 * D;
  const eyeX = D / 2;
  const eyeY = y0 + 0.15 * (y1 - y0);
  const eyeR = 0.055 * D;
  let hit = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const px = x + (sx + 0.5) / SS;
      const py = y + (sy + 0.5) / SS;
      const inTag = insideRoundRect(px, py, x0, y0, x1, y1, r);
      const inEye = (px - eyeX) ** 2 + (py - eyeY) ** 2 <= eyeR * eyeR;
      if (inTag && !inEye) hit++;
    }
  }
  return hit / (SS * SS);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const a = coverage(x, y, size);
      raw[o++] = AZURE[0];
      raw[o++] = AZURE[1];
      raw[o++] = AZURE[2];
      raw[o++] = Math.round(a * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public/icons', { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(`public/icons/icon-${size}.png`, png(size));
  console.log(`wrote public/icons/icon-${size}.png`);
}
