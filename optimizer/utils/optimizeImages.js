const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function processImage(filePath, opts = {}) {
  const { quality = 80, maxWidth = 1920 } = opts;
  const ext = path.extname(filePath).toLowerCase();
  const convertedPath = filePath.replace(new RegExp(`${escapeRegExt(ext)}$`, 'i'), '.webp');

  const stat = await fs.stat(filePath);
  const originalSize = stat.size;

  let imagePipeline = sharp(filePath);
  const metadata = await imagePipeline.metadata();

  if (metadata.width && metadata.width > maxWidth) {
    imagePipeline = imagePipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  await imagePipeline.webp({ quality }).toFile(convertedPath);

  const newStat = await fs.stat(convertedPath);
  const optimizedSize = newStat.size;

  await fs.unlink(filePath);

  return { original: filePath, converted: convertedPath, originalSize, optimizedSize };
}

function escapeRegExt(s) {
  return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

module.exports = { processImage };

