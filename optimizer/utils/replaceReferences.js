const fg = require('fast-glob');
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_EXTENSIONS = ['.html', '.css', '.js', '.jsx', '.tsx', '.vue'];
const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'];
const KNOWN_ASSET_ROOTS = ['sample-project/assets', 'public', 'static', 'assets'];

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLookupKeys(projectRoot, absoluteSource) {
  const root = normalizePath(path.resolve(projectRoot));
  const sourcePath = normalizePath(path.resolve(absoluteSource));
  const relativePath = normalizePath(path.relative(root, sourcePath));
  const keys = new Set([relativePath]);

  const fileName = path.basename(relativePath);
  if (fileName) {
    keys.add(fileName);
  }

  for (const rootName of KNOWN_ASSET_ROOTS) {
    if (relativePath.startsWith(`${rootName}/`)) {
      keys.add(relativePath.substring(rootName.length + 1));
      keys.add(`${rootName}/${relativePath.substring(rootName.length + 1)}`);
    }
  }

  return Array.from(keys).filter(Boolean);
}

async function runReplace(projectRoot, replacementItems = [], exts = DEFAULT_EXTENSIONS) {
  if (!Array.isArray(replacementItems) || replacementItems.length === 0) {
    return;
  }

  const patterns = exts.map(ext => `**/*${ext}`);
  const files = await fg(patterns, {
    cwd: projectRoot,
    absolute: true,
    onlyFiles: true,
    ignore: IGNORE_PATTERNS,
    caseSensitiveMatch: false
  });

  const replacements = replacementItems.flatMap(item => {
    const fromKeys = buildLookupKeys(projectRoot, item.from);
    return fromKeys.map(oldKey => {
      const oldExtension = path.extname(oldKey);
      return {
        old: oldKey,
        replacement: oldKey.replace(new RegExp(`${escapeRegExp(oldExtension)}$`, 'i'), '.webp')
      };
    });
  });

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    let updated = content;

    for (const { old, replacement } of replacements) {
      const pattern = new RegExp('(?:^|["\'\\(\\s=,:])(' + escapeRegExp(old) + '\\.(png|jpe?g))(?=["\'\\)\\s,;]|$)', 'gi');
      updated = updated.replace(pattern, match => match.replace(/\.(png|jpe?g)$/i, '.webp'));
    }

    if (updated !== content) {
      await fs.writeFile(file, updated, 'utf8');
      console.log(`   Updated references in ${path.relative(projectRoot, file)}`);
    }
  }
}

module.exports = { runReplace };

