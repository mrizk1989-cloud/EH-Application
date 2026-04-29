const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }
        return res.redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(403).json({
                success: false,
                message: "Token expired or invalid"
            });
        }
        return res.redirect('/');
    }
}

module.exports = { verifyToken };