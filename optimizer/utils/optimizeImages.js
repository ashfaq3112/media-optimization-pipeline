const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function processImage(filePath, opts = {}) {
  const { quality = 80, maxWidth = 1920 } = opts;
  const ext = path.extname(filePath).toLowerCase();
  const convertedPath = filePath.replace(new RegExp(`${escapeRegExt(ext)}$`), '.webp');

  // Ensure we read original stats before processing
  const stat = await fs.stat(filePath);
  const originalSize = stat.size;

  let image = sharp(filePath).webp({ quality });
  const meta = await image.metadata();
  if (meta.width && meta.width > maxWidth) {
    image = sharp(filePath).resize({ width: maxWidth }).webp({ quality });
  }

  await image.toFile(convertedPath);

  const newStat = await fs.stat(convertedPath);
  const optimizedSize = newStat.size;

  // Delete original
  await fs.unlink(filePath);

  return { original: filePath, converted: convertedPath, originalSize, optimizedSize };
}

function escapeRegExt(s) {
  return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

module.exports = { processImage };
