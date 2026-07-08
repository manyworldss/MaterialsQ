/* Generates placeholder toolbar icons: a violet rounded square on the dark
   page color. No real logo exists yet (per the design brief) — swap these for a
   bespoke mark later. Outputs public/icons/icon-{16,32,48,128}.png. */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = [10, 12, 16, 255]; // #0A0C10
const FG = [139, 92, 246, 255]; // #8B5CF6 accent

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

function png(size) {
  const inset = Math.round(size * 0.18);
  const radius = Math.round(size * 0.24);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      // rounded-square mask for the FG mark
      const inX = x >= inset && x < size - inset;
      const inY = y >= inset && y < size - inset;
      let fg = inX && inY;
      // knock out the corners to fake a radius
      const cx = x < size / 2 ? inset + radius : size - inset - radius;
      const cy = y < size / 2 ? inset + radius : size - inset - radius;
      if (fg && ((x < inset + radius || x >= size - inset - radius) && (y < inset + radius || y >= size - inset - radius))) {
        fg = (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
      }
      const c = fg ? FG : BG;
      raw[o++] = c[0];
      raw[o++] = c[1];
      raw[o++] = c[2];
      raw[o++] = c[3];
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
