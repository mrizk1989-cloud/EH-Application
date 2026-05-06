function requireDirectmanager(req, res, next) {

    if (!req.user) return res.redirect('/');

    const roles = req.user.roles || [];

    const isrequireDirectmanager =
        roles.includes('direct_manager') ||
        req.user.userType === 'direct_manager';

    if (!isrequireDirectmanager) {
        return res.redirect('/user');
    }

    next();
}

module.exports = { requireDirectmanager };