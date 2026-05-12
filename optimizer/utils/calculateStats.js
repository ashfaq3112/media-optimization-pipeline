function fromResults(results) {
  const originalBytes = results.reduce((sum, item) => sum + (item.originalSize || 0), 0);
  const optimizedBytes = results.reduce((sum, item) => sum + (item.optimizedSize || 0), 0);
  const savedBytes = Math.max(0, originalBytes - optimizedBytes);

  return {
    originalBytes,
    optimizedBytes,
    savedBytes,
    originalMB: originalBytes / 1024 / 1024,
    optimizedMB: optimizedBytes / 1024 / 1024,
    savedMB: savedBytes / 1024 / 1024
  };
}

module.exports = { fromResults };

