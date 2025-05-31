const express = require('express');
const router = express.Router();
const authenticateToken = require('../utils/authenticateToken'); 
const { encrypt } = require('../utils/crypto-util'); 
const db = require('../utils/database');


router.post('/save-credentials', authenticateToken, async (req, res) => {
    const { riotId, riotPassword } = req.body;
    if (!riotId || !riotPassword) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        const orderId = req.user.orderId;

        const encryptedPassword = encrypt(riotPassword);

        db.update(req.user.orderId, {riotId: riotId, encryptedPassword: encryptedPassword.content, passwordIV: encryptedPassword.iv}, 'credentials_received');
    } catch (error) {
        res.status(500).json({ message: 'Bilgiler kaydedilirken sunucuda bir hata oluştu.' });
    }
});

module.exports = router;