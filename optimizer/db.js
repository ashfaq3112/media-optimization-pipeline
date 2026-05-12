require('dotenv').config(); // <--- THIS IS THE MAGIC LINE
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Now process.env.MONGO_URI will actually have your string!
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;