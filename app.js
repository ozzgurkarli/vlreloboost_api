const express = require("express");
require('dotenv').config(); 
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./vlr-eloboost-firebase-adminsdk-fbsvc-b797460423.json');
const cookieParser = require('cookie-parser');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();

app.use(cookieParser());

const corsOptions = {origin: process.env.WEB_URL, credentials: true};
app.use(cors(corsOptions)); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('VlrEloBoost'));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.set('trust proxy', true);

const paymentRoutes = require('./routes/payment');
const credentialRoutes = require('./routes/credentials');

app.use('/payment', paymentRoutes);
app.use('/credentials', credentialRoutes);

app.get('/', (req, res) => {
    
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
});