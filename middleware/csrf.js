// function csrfProtection(req, res, next) {

//     const cookieToken = req.cookies.csrf_token;
//     const headerToken = req.headers["x-csrf-token"];

//     if (!cookieToken || !headerToken) {
//         return res.status(403).json({
//             success: false,
//             message: "CSRF token missing"
//         });
//     }

//     if (cookieToken !== headerToken) {
//         return res.status(403).json({
//             success: false,
//             message: "Invalid CSRF token"
//         });
//     }

//     next();
// }

// module.exports = { csrfProtection };

function csrfProtection(req, res, next) {
    // DISABLED - session auth replaces CSRF requirement
    next();
}

module.exports = { csrfProtection };