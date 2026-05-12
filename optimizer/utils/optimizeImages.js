const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function processImage(filePath, opts = {}) {

  const {
    quality = 80,
    maxWidth = 1920
  } = opts;

  const ext = path.extname(filePath).toLowerCase();

  // Skip already optimized files
  if (ext === '.webp') {
    return null;
  }

  const convertedPath = filePath.replace(
    new RegExp(`${escapeRegExt(ext)}$`, 'i'),
    '.webp'
  );

  const stat = await fs.stat(filePath);

  const originalSize = stat.size;

  let imagePipeline = sharp(filePath);

  const metadata = await imagePipeline.metadata();

  // Resize only if image exceeds max width
  if (metadata.width && metadata.width > maxWidth) {

    imagePipeline = imagePipeline.resize({
      width: maxWidth,
      withoutEnlargement: true
    });
  }

  // Convert to WebP
  await imagePipeline
    .webp({ quality })
    .toFile(convertedPath);

  const optimizedStat = await fs.stat(convertedPath);

  const optimizedSize = optimizedStat.size;

  // DELETE ORIGINAL IMAGE
  await fs.unlink(filePath);

  console.log(
    `🗑 Deleted original image: ${path.basename(filePath)}`
  );

  return {
    original: filePath,
    converted: convertedPath,
    originalSize,
    optimizedSize,
    saved: originalSize - optimizedSize
  };
}

function escapeRegExt(s) {

  return s.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

module.exports = {
  processImage
};