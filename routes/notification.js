const express = require('express');
const router = express.Router();
const db = require('../utils/database');

router.post('/contact', async (req, res) => {
    const {name, email, message} = req.body;


    try{
        await db.insertContact({
        name: name,
        email: email,
        message: message,
        user_ip: req.ip
    });
    }
    catch(error){
        handleOperationError('contact', JSON.stringify(req.data), error);
    }
});

async function handleOperationError(operation, data, error) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
        timestamp,
        operation,
        orderId,
        failedData: data, 
        error: {
            message: error.message,
            name: error.name,
            stack: error.stack
        }
    };

    console.error(`[FAILED_OPERATION] ${operation} for order ${orderId}:`, JSON.stringify(errorDetails, null, 2));  //renger logs
}

module.exports = router;