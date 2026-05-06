function requireBiorVpfinance(req, res, next) {

    if (!req.user) return res.redirect('/');

    const roles = req.user.roles || [];

    const allowedRoles = [ 'bi', 'vp_finance'];

    const isAllowed =
        roles.some(role => allowedRoles.includes(role)) ||
        allowedRoles.includes(req.user.userType);

    if (!isAllowed) {
        return res.redirect('/user');
    }

    next();
}

module.exports = { requireBiorVpfinance };