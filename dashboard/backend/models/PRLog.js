const mongoose = require('mongoose');

const PRLogSchema = new mongoose.Schema({
  repoName: String,
  prNumber: String,
  branch: String,
  optimizedFiles: [String],
  totalImages: Number,
  optimizedImages: Number,
  totalImagesOptimized: Number,
  totalOriginalSize: Number,
  totalOptimizedSize: Number,
  totalSavedBytes: Number,
  originalSizeMB: Number,
  optimizedSizeMB: Number,
  savedMB: Number,
  processingTime: Number,
  status: String,
  optimizationTimestamp: Date,
  timestamps: {
    startedAt: Date,
    finishedAt: Date
  }
});

module.exports = mongoose.model('PRLog', PRLogSchema);
