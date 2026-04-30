function verifyToken(req, res, next) {

    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }

    req.user = req.session.user;

    next();
}

module.exports = { verifyToken };