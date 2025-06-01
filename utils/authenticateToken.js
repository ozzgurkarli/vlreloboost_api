
const jwt = require('jsonwebtoken');
const db = require('./database');

function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;

    if (token == null) {
        return res.sendStatus(401); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            return res.sendStatus(403); 
        }
        
        req.user = userPayload;
        next(); 
    });
}

function authenticateAdmin(req, res, next){
    const token = req.headers.authorization.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); 
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, userPayload) => {
        if (err) {
            return res.sendStatus(403); 
        }
        
        req.user = userPayload;
        const response = await db.checkAdmin(req.user.deviceId, req.user.password);

        if(response !== true){
            return res.sendStatus(403); 
        }
                    
        next(); 
    });
}

module.exports = {authenticateToken, authenticateAdmin};