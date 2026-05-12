const mongoose = require('mongoose');

const PRLogSchema = new mongoose.Schema({
  repoName: { type: String, required: true },
  prNumber: { type: String, required: true },
  branch: { type: String, required: true },
  totalImagesOptimized: { type: Number, default: 0 },
  totalOriginalSize: { type: Number, default: 0 },
  totalOptimizedSize: { type: Number, default: 0 },
  totalSavedBytes: { type: Number, default: 0 },
  optimizedFiles: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'completed', 'no-images', 'failed'], default: 'pending' },
  optimizationTimestamp: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('PRLog', PRLogSchema);
