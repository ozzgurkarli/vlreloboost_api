
const jwt = require('jsonwebtoken');

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

module.exports = authenticateToken;