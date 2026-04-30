function requireAdmin(req, res, next) {

    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }

    const user = req.session.user;

    const isAdmin =
        (user.roles && user.roles.includes('admin')) ||
        user.userType === 'admin';

    if (!isAdmin) {
        return res.redirect('/user');
    }

    next();
}

module.exports = { requireAdmin };