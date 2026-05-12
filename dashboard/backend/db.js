const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mediaopt';
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Dashboard connected to MongoDB');
  } catch (err) {
    console.error('Dashboard DB connect error', err.message);
    process.exit(1);
  }
};
