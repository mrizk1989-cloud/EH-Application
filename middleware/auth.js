function verifyToken(req, res, next) {

    // SESSION CHECK (replaces JWT completely)
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }

    // attach user to req (standardized)
    req.user = req.session.user;

    next();
}

module.exports = { verifyToken };