import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawPixel) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // 3. IDAT Chunk (Raw scanlines: each row starts with filter byte 0)
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines.writeUInt8(0, offset++); // Filter byte None
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

  // 4. IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // Calculate CRC32 for type + data
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcTarget);
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Fast CRC32 table
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

function wobloPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer circle/rounded shape
  if (dist > 0.95) return [0, 0, 0, 0];

  // Base background: #0f172a
  let r = 15, g = 23, b = 42, a = 255;

  // Diamond shape in center
  const manhattan = Math.abs(dx) + Math.abs(dy);
  if (manhattan < 0.65) {
    // Gradient from Cyan (#06b6d4) to Indigo (#6366f1) to Purple (#a855f7)
    const t = (dy + 0.65) / 1.3;
    r = Math.round(6 * (1 - t) + 168 * t);
    g = Math.round(182 * (1 - t) + 85 * t);
    b = Math.round(212 * (1 - t) + 247 * t);
  } else if (dist > 0.88) {
    // Subtle cyan border ring
    r = 6; g = 182; b = 212;
  }

  return [r, g, b, a];
}

const outDir = path.resolve(import.meta.dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 48, 128].forEach((size) => {
  const pngBuf = createPng(size, size, wobloPixel);
  const filePath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated ${filePath}`);
});
