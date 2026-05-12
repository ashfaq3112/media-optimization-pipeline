const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PRLog = require('../optimizer/models/PRLogs');

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI);

app.get('/api/logs', async (req, res) => {
    const logs = await PRLog.find().sort({ timestamp: -1 });
    res.json(logs);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`📊 Dashboard API running on port ${PORT}`));