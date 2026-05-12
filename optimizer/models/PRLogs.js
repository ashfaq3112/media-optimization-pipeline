const mongoose = require('mongoose');

const prLogSchema = new mongoose.Schema({
    prNumber: Number,
    repoName: String,
    optimizedImages: Number,
    savedMB: Number,
    status: { type: String, default: 'Success' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PRLog', prLogSchema);