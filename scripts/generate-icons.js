import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines.writeUInt8(0, offset++);
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawScanlines.writeUInt8(r, offset++);
      rawScanlines.writeUInt8(g, offset++);
      rawScanlines.writeUInt8(b, offset++);
      rawScanlines.writeUInt8(a, offset++);
    }
  }

  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcTarget);
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

// Check point in isometric diamond polygon
function inDiamond(px, py, cx, cy, rx, ry) {
  const dx = Math.abs(px - cx) / rx;
  const dy = Math.abs(py - cy) / ry;
  return dx + dy <= 1.0;
}

function zippixPixel(x, y, w, h) {
  // Normalize coordinates to 0..128 scale (matches icon.svg)
  const sx = (x + 0.5) / w * 128;
  const sy = (y + 0.5) / h * 128;

  // Rounded rectangle bounds: x: 8..120, y: 8..120, rx: 28
  const rx = 24;
  const bx0 = 10, by0 = 10, bx1 = 118, by1 = 118;

  let insideBox = false;
  let onBorder = false;

  const qx = Math.max(bx0 + rx, Math.min(bx1 - rx, sx));
  const qy = Math.max(by0 + rx, Math.min(by1 - rx, sy));
  const distToCorner = Math.hypot(sx - qx, sy - qy);

  if (sx >= bx0 && sx <= bx1 && sy >= by0 && sy <= by1) {
    if (distToCorner <= rx) {
      insideBox = true;
      if (distToCorner >= rx - 4.5 || sx <= bx0 + 4 || sx >= bx1 - 4 || sy <= by0 + 4 || sy >= by1 - 4) {
        onBorder = true;
      }
    }
  }

  if (!insideBox) {
    return [0, 0, 0, 0];
  }

  // Border gradient
  if (onBorder) {
    const t = Math.max(0, Math.min(1, (sx + sy) / 256));
    const r = Math.round(6 * (1 - t) + 168 * t);
    const g = Math.round(182 * (1 - t) + 85 * t);
    const b = Math.round(212 * (1 - t) + 247 * t);
    return [r, g, b, 255];
  }

  // Center Sparkle circle cx: 64, cy: 44, r: 4
  const sparkleDist = Math.hypot(sx - 64, sy - 44);
  if (sparkleDist <= 4.0) {
    return [255, 255, 255, 255];
  }

  // Layer 1 (Top diamond): points="64,26 96,44 64,62 32,44" -> cx: 64, cy: 44, rx: 32, ry: 18
  if (inDiamond(sx, sy, 64, 44, 32, 18)) {
    const t = Math.max(0, Math.min(1, (sx - 32) / 64));
    const r = Math.round(6 * (1 - t) + 168 * t);
    const g = Math.round(182 * (1 - t) + 85 * t);
    const b = Math.round(212 * (1 - t) + 247 * t);
    return [r, g, b, 245];
  }

  // Layer 2 (Middle diamond): points="64,48 96,66 64,84 32,66" -> cx: 64, cy: 66, rx: 32, ry: 18
  if (inDiamond(sx, sy, 64, 66, 32, 18)) {
    return [56, 189, 248, 220]; // #38bdf8
  }

  // Layer 3 (Bottom diamond): points="64,70 96,88 64,106 32,88" -> cx: 64, cy: 88, rx: 32, ry: 18
  if (inDiamond(sx, sy, 64, 88, 32, 18)) {
    return [129, 140, 248, 230]; // #818cf8
  }

  // Background: #0f172a
  return [15, 23, 42, 255];
}

const outDir = path.resolve(import.meta.dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const pngBuf = createPng(size, size, zippixPixel);
  const filePath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated ${filePath}`);
});
