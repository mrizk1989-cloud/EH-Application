const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {

    const token = req.cookies.token;

    if (!token) return res.redirect('/');

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            roles: decoded.roles || [],
            userType: decoded.userType || null
        };

        next();

    } catch (err) {
        return res.redirect('/');
    }
}

module.exports = { verifyToken };