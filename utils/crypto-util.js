const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        content: encrypted,
    };
}

function decrypt(hash) {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(hash.iv, 'hex'));
    let decrypted = decipher.update(hash.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };