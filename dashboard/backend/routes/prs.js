const express = require('express');
const router = express.Router();
const PRLog = require('../models/PRLog');

router.get('/', async (req, res) => {
  const items = await PRLog.find().sort({ 'timestamps.startedAt': -1 }).limit(100);
  res.json(items);
});

router.get('/stats', async (req, res) => {
  const total = await PRLog.countDocuments();
  const saved = await PRLog.aggregate([{ $group: { _id: null, saved: { $sum: '$savedMB' } } }]);
  res.json({ total, savedMB: saved[0] ? saved[0].saved : 0 });
});

router.get('/:id', async (req, res) => {
  const item = await PRLog.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

module.exports = router;
