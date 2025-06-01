const admin = require('firebase-admin');
const { stat } = require('fs');
const fs = require('fs').promises; 
const path = require('path');
const { decrypt } = require('./crypto-util');

const db = admin.firestore();
const logFilePath = path.join(__dirname, 'firestore_failures.log');

async function logErrorToFile(operation, orderId, data, error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        operation,
        orderId,
        data,
        error: {
            message: error.message,
            stack: error.stack,
        },
    };

    try {
        await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
    }
}

async function handleOperationError(operation, orderId, data, error) {
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

async function insertContact(data) {
    if(!data){
        return false;
    }

    data.sendAt = admin.firestore.FieldValue.serverTimestamp();
    const contactDocRef = db.collection('contact').add(data);
}

async function insertAdmin(deviceId, encryptedPassword, passwordIV) {
    if (!deviceId || !encryptedPassword) {
        return false;
    }

    const orderDocRef = db.collection('admin').doc(deviceId);

    try {
        await orderDocRef.set({
            encryptedPassword: encryptedPassword,
            passwordIV: passwordIV,
            active: false
        });
        return true; 
    } catch (error) {
        await handleOperationError('insertAdmin', orderId, JSON.stringify(orderData), error); 
        await logErrorToFile('insertAdmin', orderId, JSON.stringify(orderData), error);
        return false; 
    }
}

async function insertOrder(orderId, orderData, status) {
    if (!orderId || !orderData) {
        return false;
    }

    const orderDocRef = db.collection('orders').doc(orderId);

    try {
        await orderDocRef.set({
            ...orderData, 
            status: status, 
            createdAt: admin.firestore.FieldValue.serverTimestamp(), 
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true; 
    } catch (error) {
        await handleOperationError('insertOrder', orderId, JSON.stringify(orderData), error); 
        await logErrorToFile('insertOrder', orderId, JSON.stringify(orderData), error);
        return false; 
    }
}

async function getWithStatus(status) {
    if(!status){
        return false;
    }

    const orderCollRef = db.collection('orders');
    const querySnapshot = await orderCollRef
            .where('status', 'in', status)
            .get();

    if (querySnapshot.empty) {
        return [];
    }

    const orders = querySnapshot.docs.map(doc => {
        return {
            id: doc.id,
            ...doc.data() 
        };
    });

    return orders;
}

async function get(orderId) {
    if(!orderId){
        return false;
    }

    const orderDocRef = db.collection('orders').doc(orderId);
    try {
        const orderSnapshot = await orderDocRef.get();

        if (!orderSnapshot.exists) {
            return null;
        } else {
            return orderSnapshot.data();
        }
    } catch (error) {
        return false; 
    }
}

async function checkAdmin(uuid, password) {
    if(!uuid){
        return false;
    }

    const orderDocRef = db.collection('admin').doc(uuid);

    try {
        const orderSnapshot = await orderDocRef.get();

        if (!orderSnapshot.exists) {
            return null;
        } else {
            const orderData = orderSnapshot.data();
            
            const decrypted = decrypt({
                iv: orderData.passwordIV,
                content: orderData.encryptedPassword
            });
            
            if(decrypted === password && orderData.active === true){
                return true;
            }

            return false;
        }
    } catch (error) {
        return false; 
    }
}

async function update(orderId, updateData, status) {
    if (!orderId || !updateData) {
        return false;
    }
    
    const orderDocRef = db.collection('orders').doc(orderId);

    try {
        await orderDocRef.update({
            ...updateData, 
            status: status, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), 
        });
        return true; 
    } catch (error) {
        await handleOperationError('update', orderId, JSON.stringify(updateData), error); 
        await logErrorToFile('update', orderId, JSON.stringify(updateData), error);
        return false; 
    } 
}

module.exports = { insertOrder, insertContact, insertAdmin, update, get, getWithStatus, checkAdmin };