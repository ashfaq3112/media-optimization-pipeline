const fg = require('fast-glob');
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_EXTENSIONS = [
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.tsx',
  '.vue'
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**'
];

function escapeRegExp(value) {

  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

async function runReplace(
  projectRoot,
  replacementItems = [],
  exts = DEFAULT_EXTENSIONS
) {

  if (!replacementItems.length) {
    return;
  }

  const patterns = exts.map(ext => `**/*${ext}`);

  const files = await fg(patterns, {
    cwd: projectRoot,
    absolute: true,
    onlyFiles: true,
    ignore: IGNORE_PATTERNS
  });

  for (const file of files) {

    let content = await fs.readFile(file, 'utf8');

    let updated = false;

    for (const item of replacementItems) {

      const oldFile = path.basename(item.original);

      const newFile = path.basename(item.converted);

      const regex = new RegExp(
        escapeRegExp(oldFile),
        'g'
      );

      if (regex.test(content)) {

        content = content.replace(regex, newFile);

        updated = true;
      }
    }

    if (updated) {

      await fs.writeFile(file, content, 'utf8');

      console.log(
        `✅ Updated references in ${path.relative(projectRoot, file)}`
      );
    }
  }
}

module.exports = {
  runReplace
};