const express = require('express');
const router = express.Router();
const db = require('../utils/database');

router.post('/contact', (req, res) => {
    const {name, email, message} = req.body;


    db.insertContact({
        name: name,
        email: email,
        message: message,
        user_ip: req.ip
    })
});

module.exports = router;