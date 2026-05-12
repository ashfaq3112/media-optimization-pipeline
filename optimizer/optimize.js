require('dotenv').config();
const path = require('path');
const { performance } = require('perf_hooks');

const connectDB = require('./db');
const PRLog = require('./models/PRLog');
const { scanAssets, DEFAULT_ASSET_PATHS } = require('./utils/scanAssets');
const { processImage } = require('./utils/optimizeImages');
const replaceReferences = require('./utils/replaceReferences');
const calculateStats = require('./utils/calculateStats');

const PROJECT_ROOT = process.env.WORKSPACE_PATH || '/workspace';
const ASSET_FOLDERS = process.env.ASSET_FOLDERS
  ? process.env.ASSET_FOLDERS.split(',').map(folder => folder.trim()).filter(Boolean)
  : DEFAULT_ASSET_PATHS;
const CODE_FILE_EXTENSIONS = ['.html', '.css', '.js', '.jsx', '.tsx', '.vue'];

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
    const start = performance.now();
    await connectDB();

    const prNumber = process.env.PR_NUMBER || 'local';
    const branch = process.env.BRANCH_NAME || 'local-branch';
    const repo = process.env.REPO_NAME || 'unknown/repo';

    console.log(`Starting optimizer for ${repo} #${prNumber} on ${branch}`);

  console.log('Scanning assets...');
  const images = await scanAssets(PROJECT_ROOT, ASSET_FOLDERS);

  if (images.length === 0) {
    console.log('No supported image assets found. Nothing to optimize.');
    await PRLog.create({
      repoName: repo,
      prNumber: String(prNumber),
      branch,
      totalImagesOptimized: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      totalSavedBytes: 0,
      optimizedFiles: [],
      status: 'no-images',
      optimizationTimestamp: new Date()
    });
    process.exit(0);
  }

  const optimizedResults = [];
  for (const imagePath of images) {
    const relativePath = path.relative(PROJECT_ROOT, imagePath);
    console.log(`Optimizing image: ${relativePath}`);

    try {
      const result = await processImage(imagePath, { quality: 80, maxWidth: 1920 });
      optimizedResults.push(result);
      console.log(`✅ Converted ${relativePath} → ${path.relative(PROJECT_ROOT, result.converted)} (${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)})`);
    } catch (err) {
      console.error('Image optimization failed for', relativePath, err.message);
    }
  }

  console.log('Updating references...');
  await replaceReferences.runReplace(
    PROJECT_ROOT,
    optimizedResults.map(item => ({ from: item.original, to: item.converted })),
    CODE_FILE_EXTENSIONS
  );

  const stats = calculateStats.fromResults(optimizedResults);
  const record = await PRLog.create({
    repoName: repo,
    prNumber: String(prNumber),
    branch,
    totalImagesOptimized: optimizedResults.length,
    totalOriginalSize: stats.originalBytes,
    totalOptimizedSize: stats.optimizedBytes,
    totalSavedBytes: stats.savedBytes,
    optimizedFiles: optimizedResults.map(item => path.relative(PROJECT_ROOT, item.converted).split(path.sep).join('/')),
    status: 'completed',
    optimizationTimestamp: new Date()
  });

  const durationSeconds = ((performance.now() - start) / 1000).toFixed(2);

  console.log(`Saved ${formatBytes(stats.savedBytes)} across ${optimizedResults.length} file(s)`);
  console.log(`MongoDB analytics saved: ${record._id}`);
  console.log(`Optimization completed in ${durationSeconds} seconds`);
  process.exit(0);
}

main().catch(err => {
    console.error('Fatal error in optimizer:', err);
    process.exit(1);
});