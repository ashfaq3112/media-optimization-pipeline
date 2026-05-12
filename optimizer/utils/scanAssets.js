const fg = require('fast-glob');
const path = require('path');
const fs = require('fs').promises;

const DEFAULT_ASSET_PATHS = ['sample-project/assets', 'public', 'static', 'assets'];
const IMAGE_GLOB = '**/*.{png,jpg,jpeg}';
const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**'];

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

async function directoryExists(directory) {
  try {
    const stat = await fs.stat(directory);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function scanAssets(projectRoot, folders = DEFAULT_ASSET_PATHS) {
  const root = path.resolve(projectRoot);
  const scanFolders = [];

  for (const folder of folders) {
    if (!folder || typeof folder !== 'string') {
      continue;
    }

    const absoluteFolder = path.resolve(root, folder);
    if (await directoryExists(absoluteFolder)) {
      scanFolders.push(normalizePath(absoluteFolder));
    } else {
      console.log(`⚠️  Asset folder not found, skipping: ${absoluteFolder}`);
    }
  }

  if (scanFolders.length === 0) {
    return [];
  }

  const patterns = scanFolders.map(folder => `${folder}/${IMAGE_GLOB}`);
  const files = await fg(patterns, {
    onlyFiles: true,
    caseSensitiveMatch: false,
    unique: true,
    dot: false,
    ignore: IGNORE_PATTERNS
  });

  return files.map(file => path.normalize(file));
}

module.exports = { scanAssets, DEFAULT_ASSET_PATHS };
