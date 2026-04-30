const rateLimit = require('express-rate-limit');

// ================= LOGIN LIMITER =================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

// ================= REGISTER LIMITER =================
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many accounts created. Try again later."
    }
});

// ================= GLOBAL API LIMITER (NEW - IMPORTANT) =================
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // general traffic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Slow down."
    }
});

// ================= ADMIN LIMITER (NEW) =================
const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Admin rate limit exceeded"
    }
});

// ================= REQUEST FORM LIMITER (NEW) =================
const requestLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests submitted. Please wait."
    }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    apiLimiter,
    adminLimiter,
    requestLimiter
};