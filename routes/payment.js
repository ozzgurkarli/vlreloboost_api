const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const nodeBase64 = require('nodejs-base64-converter');
const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const tempStorage = require('../utils/temp-storage');
const { v4: uuidv4 } = require('uuid'); 

const merchant_id = process.env.PAYTR_MERCHANT_ID;
const merchant_key = process.env.PAYTR_MERCHANT_KEY;
const merchant_salt = process.env.PAYTR_MERCHANT_SALT;
const web_url = process.env.WEB_URL;

router.post('/', async (req, res) => {
    try {
        const user_ip = req.ip; 
        const merchant_oid = uuidv4().replace(/-/g, '').toUpperCase();

        const {
            payment_amount, 
            user_basket, 
            name,
            email,
            phone,
            address,
            agents,
            notes
        } = req.body;
        
        const payload = {
            orderId: merchant_oid,
            name: name,
            email: email,
            phone: phone,
            paymentAmount: payment_amount,
            notes: notes,
            agents: agents,
            user_ip: user_ip,
            service: JSON.parse(Buffer.from(user_basket, 'base64').toString('utf8'))[0][0]
        };

        const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        const merchant_ok_url = `${process.env.APP_URL}/payment/payment-ok?order_id=${merchant_oid}&token=${authToken}`;
        const merchant_fail_url = `${web_url}/odeme-basarisiz.html`;

        const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}00TL${process.env.TEST_MODE}`;
        const paytr_token = crypto.createHmac('sha256', merchant_key).update(hashSTR + merchant_salt).digest('base64');
        
        const postData = new URLSearchParams();
        postData.append('merchant_id', merchant_id);
        postData.append('user_ip', user_ip);
        postData.append('merchant_oid', merchant_oid);
        postData.append('email', email);
        postData.append('payment_amount', payment_amount);
        postData.append('paytr_token', paytr_token);
        postData.append('user_basket', user_basket);
        postData.append('debug_on', '1');
        postData.append('no_installment', '0');
        postData.append('max_installment', '0');
        postData.append('user_name', name);
        postData.append('user_address', address);
        postData.append('user_phone', phone);
        postData.append('merchant_ok_url', merchant_ok_url);
        postData.append('merchant_fail_url', merchant_fail_url);
        postData.append('timeout_limit', '30');
        postData.append('currency', 'TL');
        postData.append('test_mode', process.env.TEST_MODE);

        const response = await axios.post(`${process.env.PAYTR_URL}/odeme/api/get-token`, postData);
        
        const { status } = response.data;

        if (status === 'success') {
            tempStorage.set(merchant_oid, payload);
            res.json(response.data);
        } else {            
            res.status(400).json(response.data);
        }

    } catch (error) {        
        res.status(500).json({ status: 'failed', reason: 'Sunucuda bir hata oluştu.' });
    }
});

router.get('/payment-ok', async (req, res) => {
    try {
        const { order_id } = req.query;
        if (!order_id) {
            return res.status(400).send('Eksik sipariş bilgisi.');
        }

        const payload = { orderId: order_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('auth_token', token, {
            httpOnly: true, 
            secure: true,
            sameSite: 'None',
            path: '/',
            maxAge: 3600000 
        });

        res.redirect(`${web_url}/siparis-basarili.html?order_id=${order_id}`); 

    } catch (error) {
    }
});

router.post('/callback', (req, res) => {
    const { merchant_oid, status, total_amount, failed_reason_code, failed_reason_msg, hash } = req.body;

    const generatedHash = crypto.createHmac('sha256', merchant_key).update(merchant_oid + merchant_salt + status + total_amount).digest('base64');
    if (hash !== generatedHash) {
        return res.status(400).send('Hash uyuşmazlığı.');
    }

    const payload = tempStorage.get(merchant_oid);

    if (status === 'success' && payload !== undefined) {
        db.insertOrder(merchant_oid, payload, 'payment_success');
        tempStorage.del(payload);
    } else if(status === 'failed' && payload !== undefined){
        payload.failed_reason_code = failed_reason_code;
        payload.failed_reason_msg = failed_reason_msg;
        db.insertOrder(merchant_oid, payload, 'payment_failed');
    }

    res.send('OK');
});

module.exports = router;