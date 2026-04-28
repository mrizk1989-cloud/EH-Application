// const jwt = require('jsonwebtoken');

// function verifyToken(req, res, next) {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//         return res.status(401).json({ message: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         return res.status(403).json({ message: 'Invalid token' });
//     }
// }

// function isAdmin(req, res, next) {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Admin only' });
//     }
//     next();
// }

// module.exports = { verifyToken, isAdmin };

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Token expired or invalid"
        });
    }
}

module.exports = { verifyToken };