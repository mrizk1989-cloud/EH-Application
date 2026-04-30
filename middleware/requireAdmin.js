function requireAdmin(req, res, next) {

    if (!req.user) return res.redirect('/');

    const roles = req.user.roles || [];

    const isAdmin =
        roles.includes('admin') ||
        req.user.userType === 'admin';

    if (!isAdmin) {
        return res.redirect('/user');
    }

    next();
}

module.exports = { requireAdmin };