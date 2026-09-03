const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const outDir = path.join(__dirname, '..', 'public');

function createIcoFromPngBuffers(entries) {
  // entries: array of { width, height, buffer }
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let currentOffset = 6 + count * 16;
  const dirEntries = [];
  const bodyParts = [];

  for (const item of entries) {
    const dir = Buffer.alloc(16);
    const w = item.width >= 256 ? 0 : item.width;
    const h = item.height >= 256 ? 0 : item.height;
    dir.writeUInt8(w, 0);
    dir.writeUInt8(h, 1);
    dir.writeUInt8(0, 2); // color count
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // planes
    dir.writeUInt16LE(32, 6); // bpp
    dir.writeUInt32LE(item.buffer.length, 8);
    dir.writeUInt32LE(currentOffset, 12);

    dirEntries.push(dir);
    bodyParts.push(item.buffer);
    currentOffset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...bodyParts]);
}

async function build() {
  console.log('Rendering SVG with sharp (Lanczos3)...');

  // Generate main PNG icons
  const p512 = await sharp(svgPath).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'icon-512.png'), p512);

  const p256 = await sharp(svgPath).resize(256, 256).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'icon-256.png'), p256);

  const p192 = await sharp(svgPath).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'icon-192.png'), p192);

  // Sizes for Windows ICO (256, 128, 64, 48, 32, 24, 16)
  const icoSizes = [256, 128, 64, 48, 32, 24, 16];
  const icoEntries = [];

  for (const size of icoSizes) {
    const buf = await sharp(svgPath).resize(size, size).png().toBuffer();
    icoEntries.push({ width: size, height: size, buffer: buf });
  }

  const icoBuf = createIcoFromPngBuffers(icoEntries);
  const icoPath = path.join(outDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuf);

  console.log('✅ Success! Created public/icon.ico with sizes:', icoSizes.join(', '));
  console.log('ICO total size:', icoBuf.length, 'bytes');
}

build().catch(err => {
  console.error('Build icons error:', err);
  process.exit(1);
});
