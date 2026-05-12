require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

const connectDB = require('./db');
const PRLog = require('./models/PRLog');
const changedFilesUtil = require('./utils/changedFiles');
const optimizeImages = require('./utils/optimizeImages');
const replaceReferences = require('./utils/replaceReferences');
const calculateStats = require('./utils/calculateStats');
const gitHelper = require('./gitHelper');
const commentPR = require('./commentPR');

const PROJECT_ROOT = process.env.WORKSPACE_PATH || '/workspace';

async function main() {
    const start = performance.now();
    await connectDB();

    const prNumber = process.env.PR_NUMBER || 'local';
    const branch = process.env.BRANCH_NAME || 'local-branch';
    const repo = process.env.REPO_NAME || 'unknown/repo';

    console.log(`Starting optimizer for ${repo} #${prNumber} on ${branch}`);

    // 1) Read changed files list (produced by GitHub Actions) or compute fallback
    const changedFilesPath = process.env.CHANGED_FILES_PATH || path.join(PROJECT_ROOT, 'changed-files.txt');
    const changedImagesPath = process.env.CHANGED_IMAGES_PATH || path.join(PROJECT_ROOT, 'changed-images.json');

    const changedFiles = await changedFilesUtil.readChangedFiles(changedFilesPath);
    const changedImages = await changedFilesUtil.readChangedImages(changedImagesPath, changedFiles, PROJECT_ROOT);

    if (changedImages.length === 0) {
        console.log('No changed image files detected. Exiting.');
        await PRLog.create({ repoName: repo, prNumber, branch, status: 'no-images', timestamps: { startedAt: new Date() } });
        process.exit(0);
    }

    // 2) Optimize images
    const optimizedResults = [];
    for (const imgPath of changedImages) {
        try {
            const res = await optimizeImages.processImage(imgPath, { quality: 80, maxWidth: 1920 });
            optimizedResults.push(res);
        } catch (err) {
            console.error('Image optimization failed for', imgPath, err.message);
        }
    }

    // 3) Replace references in code files safely
    const codeFileExts = ['.js', '.jsx', '.tsx', '.html', '.css', '.vue'];
    const replacements = optimizedResults.map(r => ({ from: path.basename(r.original), to: path.basename(r.converted) }));
    await replaceReferences.runReplace(PROJECT_ROOT, replacements, codeFileExts);

    // 4) Commit & push changes back to PR branch
    try {
        await gitHelper.commitAndPushChanges(PROJECT_ROOT, process.env.GITHUB_TOKEN, branch, `chore: optimize images for PR #${prNumber}`);
    } catch (err) {
        console.error('Git commit/push failed:', err.message);
    }

    // 5) Calculate stats and persist to MongoDB
    const stats = await calculateStats.fromResults(optimizedResults);
    const prRecord = await PRLog.create({
        repoName: repo,
        prNumber,
        branch,
        optimizedFiles: optimizedResults.map(r => r.converted),
        totalImages: changedImages.length,
        optimizedImages: optimizedResults.length,
        originalSizeMB: stats.originalMB,
        optimizedSizeMB: stats.optimizedMB,
        savedMB: stats.savedMB,
        processingTime: (performance.now() - start) / 1000,
        status: 'completed',
        timestamps: { startedAt: new Date(), finishedAt: new Date() }
    });

    // 6) Comment on PR
    try {
        await commentPR.commentOnPR(process.env.GITHUB_TOKEN, repo, prNumber, optimizedResults, stats);
    } catch (err) {
        console.error('Failed to post PR comment:', err.message);
    }

    console.log(`Optimization complete. Saved ${stats.savedMB.toFixed(2)} MB across ${optimizedResults.length} files.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error in optimizer:', err);
    process.exit(1);
});