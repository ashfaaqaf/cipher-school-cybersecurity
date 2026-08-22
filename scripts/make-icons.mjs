/**
 * Home screen icons.
 *
 * The manifest used to point at og.png — a 1200x630 social banner — as the
 * app icon, so an installed copy got a squashed or letterboxed tile on every
 * platform that renders one. These are the square icons it actually needs.
 *
 * They are drawn here rather than exported from a design tool because the mark
 * is two letters on a flat ground: a 5x7 bitmap and a PNG encoder is less to
 * maintain than a binary asset nobody can diff, and it regenerates if the
 * colours ever change.
 *
 *   node scripts/make-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

/* The two glyphs of the mark, 5x7, same as any terminal font. */
const GLYPHS = {
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
};

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];

/** Lay "CS" out on a size x size canvas, filling `coverage` of the width. */
function draw(size, coverage) {
  const cols = 11; // 5 + 1 gap + 5
  const rows = 7;
  const unit = Math.max(1, Math.round((size * coverage) / cols));
  const w = unit * cols;
  const h = unit * rows;
  const x0 = Math.round((size - w) / 2);
  const y0 = Math.round((size - h) / 2);

  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i += 1) {
    px[i * 3] = BLACK[0];
    px[i * 3 + 1] = BLACK[1];
    px[i * 3 + 2] = BLACK[2];
  }

  const put = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3;
    px[i] = WHITE[0];
    px[i + 1] = WHITE[1];
    px[i + 2] = WHITE[2];
  };

  'CS'.split('').forEach((ch, gi) => {
    const g = GLYPHS[ch];
    const gx = x0 + gi * 6 * unit;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        if (g[r][c] !== '1') continue;
        for (let dy = 0; dy < unit; dy += 1) {
          for (let dx = 0; dx < unit; dx += 1) put(gx + c * unit + dx, y0 + r * unit + dy);
        }
      }
    }
  });

  return px;
}

/* ---------- a minimal PNG encoder: signature, IHDR, IDAT, IEND ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // 10, 11, 12 stay zero: deflate, adaptive filtering, no interlace

  // One filter byte per scanline, filter 0 (None) — the image is two flat
  // colours, so deflate does the work and a smarter filter buys nothing.
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/*
 * Two coverages. A plain icon can use the full tile; a maskable one is cropped
 * to a circle on some launchers, so its mark stays inside the middle 80%.
 */
const ICONS = [
  ['icon-192.png', 192, 0.6],
  ['icon-512.png', 512, 0.6],
  ['icon-maskable-512.png', 512, 0.42],
  ['apple-touch-icon.png', 180, 0.56],
];

for (const [name, size, coverage] of ICONS) {
  const bytes = png(size, draw(size, coverage));
  await writeFile(path.join(OUT, name), bytes);
  console.log(`${name.padEnd(24)} ${size}x${size}  ${(bytes.length / 1024).toFixed(1)}kB`);
}
