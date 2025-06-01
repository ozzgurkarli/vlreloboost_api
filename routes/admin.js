const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../utils/authenticateToken');
const { encrypt, decrypt } = require('../utils/crypto-util');
const db = require('../utils/database');
const jwt = require('jsonwebtoken'); 

router.get('/active-orders', authenticateAdmin, async (req, res)=> {
    try{
        const orders = await db.getWithStatus(['credentials_received', 'ongoing']);

        if (!Array.isArray(orders)) {
            return res.status(500).json({ status: 'error', message: 'Siparişler alınamadı.' });
        }

        res.json({status: 'success', data: orders});
    }
    catch(error){
        res.status(500).json({ status: 'error', message: 'Sunucuda beklenmedik bir hata oluştu.' });
    }
});

router.get('/get-password', authenticateAdmin, async (req, res) => {
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ status: 'error', message: 'Sipariş IDsi gerekli.' });
    }

    try {
        const orderData = await db.get(orderId);

        if (!orderData || !orderData.passwordIV || !orderData.encryptedPassword) {
            return res.status(404).json({ status: 'error', message: 'Sipariş veya şifre bilgisi bulunamadı.' });
        }

        const decryptedPassword = decrypt({
            iv: orderData.passwordIV,
            content: orderData.encryptedPassword
        });

        res.json({ status: 'success', password: decryptedPassword });
    } catch (error) {
        console.error("Şifre çözme hatası:", error);
        res.status(500).json({ status: 'error', message: 'Şifre çözülürken bir hata oluştu.' });
    }
});

router.post('/register', async (req, res) => {
    const { deviceId, password } = req.body;

    const encryptedPassword = encrypt(password);

    try {
        await db.insertAdmin(deviceId, encryptedPassword.content, encryptedPassword.iv);
        res.status(200).json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ message: 'Bilgiler kaydedilirken sunucuda bir hata oluştu.' });
    }
});

router.post('/login', async (req, res) => {
    const { deviceId, password } = req.body;

    if (!deviceId || !password) {
        return res.status(400).json({ status: 'error', message: 'Cihaz IDsi ve parola gereklidir.' });
    }

    try {
        const validAdmin = await db.checkAdmin(deviceId, password);

        if(validAdmin === true){
            const payload = {
                deviceId: deviceId,
                password, password
            };
            const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({ status: 'success', token: authToken});
        }
        else{            
            res.status(401).json({ 
                status: 'error',
                message: 'Geçersiz cihaz IDsi veya parola.'
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Bilgiler kaydedilirken sunucuda bir hata oluştu.' });
    }   
});

router.post('/update-boost', authenticateAdmin, async (req, res)=> {
    const { orderId, currentRankName, currentLp, wins, losses } = req.body;

    await db.update(orderId, req.body, 'ongoing');

    res.status(200).json({ status: 'success' });
});

router.post('/complete-boost', authenticateAdmin, async (req, res)=> {
    const { orderId } = req.body;

    await db.update(orderId, req.body, 'completed');

    res.status(200).json({ status: 'success' });
});

module.exports = router;