const express = require('express');
const router = express.Router();
const {authenticateToken } = require('../utils/authenticateToken'); 
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

        await db.update(req.user.orderId, {riotId: riotId, encryptedPassword: encryptedPassword.content, passwordIV: encryptedPassword.iv}, 'credentials_received');
        res.status(200).json( {message: 'success'});
    } catch (error) {
        res.status(500).json({ message: 'Bilgiler kaydedilirken sunucuda bir hata oluştu.' });
    }
});

router.get('/track', async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ status: 'failed', message: 'Lütfen bir sipariş numarası girin.' });
    }

    const orderData = await db.get(orderId);

    if (orderData === null) {
        return res.status(404).json({ status: 'failed', message: 'Bu numaraya ait bir sipariş bulunamadı.' });
    }
    else if (orderData === false) {
        return res.status(500).json({ status: 'failed', message: 'Sipariş durumu sorgulanırken bir sunucu hatası oluştu.' });
    }

    const safeData = {
        orderId: orderData.orderId,
        status: orderData.status,
        service: orderData.service,
        currentRankName: orderData.currentRankName ?? '',
        currentLp: orderData.currentLp ?? 0,
        wins: orderData.wins ?? 0,
        losses: orderData.losses ?? 0
    }

    res.json({ status: 'success', data: safeData });
});

module.exports = router;