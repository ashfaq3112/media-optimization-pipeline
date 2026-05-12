const { Octokit } = require('@octokit/rest');

async function commentOnPR(token, repoFullName, prNumber, optimizedResults, stats) {
  if (!token) throw new Error('GITHUB token required');
  const [owner, repo] = repoFullName.split('/');
  const octokit = new Octokit({ auth: token });

  const lines = [];
  lines.push('✅ Media Optimization Completed');
  lines.push('');
  lines.push(`Optimized Files: ${optimizedResults.length}`);
  lines.push(`Space Saved: ${stats.savedMB.toFixed(2)} MB`);
  lines.push(`Compression Ratio: ${Math.round((stats.optimizedMB / stats.originalMB) * 100)}%`);
  lines.push('');
  lines.push('Converted:');
  for (const r of optimizedResults) {
    lines.push(`* ${r.original} → ${r.converted}`);
  }

  const body = lines.join('\n');
  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body });
}

module.exports = { commentOnPR };
