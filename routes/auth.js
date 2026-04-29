const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');


// ================= REGISTER =================
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // ✅ validate first
        if (!fullName || !email || !password) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // ✅ normalize AFTER validation
        const emailNormalized = email.toLowerCase().trim();

        // ✅ email check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailNormalized)) {
            return res.json({ success: false, message: "Invalid email format" });
        }

        // ✅ password strength
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPassword.test(password)) {
            return res.json({
                success: false,
                message: "Password must be 8+ chars, include uppercase, lowercase, number"
            });
        }

        let user;

        try {
            user = await User.create({
                user_type: 'user',
                user_name: fullName,
                user_email: emailNormalized,
                user_password: await bcrypt.hash(password, 10)
            });

        } catch (err) {
            if (err.code === 11000) {
                return res.json({ success: false, message: "Email already exists" });
            }
            throw err;
        }

        // 🔐 JWT
        const token = jwt.sign(
            {
                id: user._id,
                userType: user.user_type,
                roles: user.roles
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        // 🔐 CSRF token (NEW)
        const csrfToken = crypto.randomBytes(32).toString('hex');

        // 🍪 JWT cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60
        });

        // 🍪 CSRF cookie (NOT httpOnly so frontend can read it)
        res.cookie("csrf_token", csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Account created successfully",
            csrfToken
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


// ================= LOGIN =================
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ validate first
        if (!email || !password) {
            return res.json({ success: false, message: "Email and password required" });
        }

        // ✅ normalize AFTER validation
        const emailNormalized = email.toLowerCase().trim();

        const user = await User.findOne({ user_email: emailNormalized });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.user_password);

        if (!match) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // 🔐 JWT
        const token = jwt.sign(
            {
                id: user._id,
                userType: user.user_type,
                roles: user.roles
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        // 🔐 CSRF token (NEW)
        const csrfToken = crypto.randomBytes(32).toString('hex');

        // 🍪 JWT cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60
        });

        // 🍪 CSRF cookie
        res.cookie("csrf_token", csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Login successful",
            csrfToken
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


// ================= LOGOUT =================
router.post('/logout', (req, res) => {

    res.clearCookie("token");
    res.clearCookie("csrf_token"); // NEW

    return res.json({
        success: true,
        message: "Logged out successfully"
    });
});


module.exports = router;