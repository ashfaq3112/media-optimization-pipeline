const mongoose = require('mongoose');

const PRLogSchema = new mongoose.Schema({
  repoName: String,
  prNumber: String,
  branch: String,
  optimizedFiles: [String],
  totalImages: Number,
  optimizedImages: Number,
  originalSizeMB: Number,
  optimizedSizeMB: Number,
  savedMB: Number,
  processingTime: Number,
  status: { type: String, default: 'pending' },
  timestamps: {
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date
  }
});

module.exports = mongoose.model('PRLog', PRLogSchema);
