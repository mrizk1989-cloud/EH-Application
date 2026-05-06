function requireBudgetcontrole(req, res, next) {

    if (!req.user) return res.redirect('/');

    const roles = req.user.roles || [];

    const isBudgetcontrole =
        roles.includes('budget_control') ||
        req.user.userType === 'budget_control';

    if (!isBudgetcontrole) {
        return res.redirect('/user');
    }

    next();
}

module.exports = { requireBudgetcontrole };