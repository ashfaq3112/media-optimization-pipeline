function fromResults(results) {
  const originalBytes = results.reduce((s, r) => s + (r.originalSize || 0), 0);
  const optimizedBytes = results.reduce((s, r) => s + (r.optimizedSize || 0), 0);
  const saved = Math.max(0, originalBytes - optimizedBytes);
  return {
    originalMB: originalBytes / 1024 / 1024,
    optimizedMB: optimizedBytes / 1024 / 1024,
    savedMB: saved / 1024 / 1024
  };
}

module.exports = { fromResults };
