const fg = require('fast-glob');
const path = require('path');
const replacer = require('./replacer');

async function runReplace(projectRoot, replacements, exts = ['.js','.jsx','.tsx','.html','.css','.vue']){
  const patterns = exts.map(e => `**/*${e}`);
  const files = fg.sync(patterns, { cwd: projectRoot, absolute: true, ignore: ['node_modules/**', '.git/**'] });
  replacer(files, replacements.map(r => ({ oldBase: r.from, newBase: r.to })) );
}

module.exports = { runReplace };
