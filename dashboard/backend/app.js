require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const prs = require('./routes/prs');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/prs', prs);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Dashboard backend listening on ${PORT}`));
