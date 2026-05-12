require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

const connectDB = require('./db');
const PRLog = require('./models/PRLog');

const { scanAssets, DEFAULT_ASSET_PATHS } = require('./utils/scanAssets');
const { processImage } = require('./utils/optimizeImages');
const replaceReferences = require('./utils/replaceReferences');
const calculateStats = require('./utils/calculateStats');

const PROJECT_ROOT = process.env.WORKSPACE_PATH || '/workspace';

const ASSET_FOLDERS = process.env.ASSET_FOLDERS
  ? process.env.ASSET_FOLDERS
      .split(',')
      .map(folder => folder.trim())
      .filter(Boolean)
  : DEFAULT_ASSET_PATHS;

const CODE_FILE_EXTENSIONS = [
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.tsx',
  '.vue'
];

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {

  const start = performance.now();

  await connectDB();

  const prNumber = process.env.PR_NUMBER || 'local';
  const branch = process.env.BRANCH_NAME || 'local-branch';
  const repo = process.env.REPO_NAME || 'unknown/repo';

  console.log(
    `Starting optimizer for ${repo} PR #${prNumber} on branch ${branch}`
  );

  console.log('Scanning assets...');

  const images = await scanAssets(
    PROJECT_ROOT,
    ASSET_FOLDERS
  );

  console.log(`Found ${images.length} image(s)`);

  if (images.length === 0) {

    console.log('No supported image assets found.');

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

    const relativePath = path
      .relative(PROJECT_ROOT, imagePath)
      .split(path.sep)
      .join('/');

    console.log(`Optimizing image: ${relativePath}`);

    try {

      const result = await processImage(imagePath, {
        quality: 80,
        maxWidth: 1920
      });

      optimizedResults.push(result);

      const convertedRelative = path
        .relative(PROJECT_ROOT, result.converted)
        .split(path.sep)
        .join('/');

      console.log(
        `✅ Converted ${relativePath} → ${convertedRelative}`
      );

      console.log(
        `   ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)}`
      );

      // VERIFY ORIGINAL FILE REMOVED
      if (!fs.existsSync(imagePath)) {
        console.log(`🗑 Deleted original: ${relativePath}`);
      } else {
        console.log(`⚠ Original still exists: ${relativePath}`);
      }

    } catch (err) {

      console.error(
        `❌ Failed optimizing ${relativePath}:`,
        err.message
      );
    }
  }

  console.log('Updating references...');

  await replaceReferences.runReplace(
    PROJECT_ROOT,
    optimizedResults.map(item => ({
      original: item.original,
      converted: item.converted
    })),
    CODE_FILE_EXTENSIONS
  );

  console.log('Reference update completed');

  const stats = calculateStats.fromResults(
    optimizedResults
  );

  const optimizedFiles = optimizedResults.map(item =>
    path
      .relative(PROJECT_ROOT, item.converted)
      .split(path.sep)
      .join('/')
  );

  const record = await PRLog.create({
    repoName: repo,
    prNumber: String(prNumber),
    branch,
    totalImagesOptimized: optimizedResults.length,
    totalOriginalSize: stats.originalBytes,
    totalOptimizedSize: stats.optimizedBytes,
    totalSavedBytes: stats.savedBytes,
    optimizedFiles,
    status: 'completed',
    optimizationTimestamp: new Date()
  });

  const durationSeconds = (
    (performance.now() - start) / 1000
  ).toFixed(2);

  console.log('\n========== FINAL REPORT ==========');

  console.log(
    `Images Optimized: ${optimizedResults.length}`
  );

  console.log(
    `Original Size: ${formatBytes(stats.originalBytes)}`
  );

  console.log(
    `Optimized Size: ${formatBytes(stats.optimizedBytes)}`
  );

  console.log(
    `Total Saved: ${formatBytes(stats.savedBytes)}`
  );

  console.log(
    `MongoDB Analytics ID: ${record._id}`
  );

  console.log(
    `Completed in ${durationSeconds} seconds`
  );

  console.log('==================================');

  process.exit(0);
}

main().catch(err => {

  console.error('Fatal optimizer error:', err);

  process.exit(1);
});