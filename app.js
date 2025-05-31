const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

const userRoutes = require('./routes/user');

app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda Ã§alÄ±ÅŸÄ±yor`);
});