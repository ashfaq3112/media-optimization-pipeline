const { execSync } = require('child_process');
const path = require('path');

async function commitAndPushChanges(workspacePath, githubToken, branch, message) {
  if (!githubToken) throw new Error('GITHUB_TOKEN required to push changes');

  const opts = { cwd: workspacePath, stdio: 'inherit' };

  // Configure author
  execSync('git config user.email "optimizer-bot@example.com"', opts);
  execSync('git config user.name "Media Optimizer Bot"', opts);

  // Add and commit
  execSync('git add -A', opts);
  try {
    execSync(`git commit -m "${message}"`, opts);
  } catch (err) {
    // No changes to commit
    console.log('No commit necessary:', err.message);
  }

  // Set remote with token for auth
  const remoteUrl = `https://x-access-token:${githubToken}@github.com/${process.env.REPO_NAME}.git`;
  try {
    execSync(`git remote set-url origin ${remoteUrl}`, opts);
  } catch (err) {
    console.warn('Could not set remote URL:', err.message);
  }

  // Push
  execSync(`git push origin HEAD:${branch}`, opts);
}

module.exports = { commitAndPushChanges };
