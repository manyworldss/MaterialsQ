import sharp from 'sharp';
import fs from 'fs';

const svg = fs.readFileSync('public/icons/logo.svg');
for (const size of [16, 32, 48, 128]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}
