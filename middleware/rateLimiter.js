const rateLimit = require('express-rate-limit');

// 🔐 LOGIN limiter (strict)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 🔥 5 attempts per window
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 📝 REGISTER limiter (moderate)
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many accounts created. Try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    registerLimiter
};