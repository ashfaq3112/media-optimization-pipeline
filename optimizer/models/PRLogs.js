const mongoose = require('mongoose');

const prLogSchema = new mongoose.Schema({
    prNumber: String,         // <--- CHANGE THIS FROM 'Number' TO 'String'
    repoName: String,
    optimizedImages: Number,
    savedMB: Number,
    status: { type: String, default: 'Success' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PRLog', prLogSchema);