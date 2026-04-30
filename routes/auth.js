const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');


// ================= REGISTER =================
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const emailNormalized = email.toLowerCase().trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailNormalized)) {
            return res.json({ success: false, message: "Invalid email format" });
        }

        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPassword.test(password)) {
            return res.json({
                success: false,
                message: "Weak password (min 8 chars, upper, lower, number)"
            });
        }

        let user;

        try {
            user = await User.create({
                user_type: 'user',
                user_name: fullName,
                user_email: emailNormalized,
                user_password: await bcrypt.hash(password, 10),
                roles: []
            });

        } catch (err) {
            if (err.code === 11000) {
                return res.json({ success: false, message: "Email already exists" });
            }
            throw err;
        }

        // ================= SESSION LOGIN =================
        req.session.user = {
            id: user._id,
            name: user.user_name,
            email: user.user_email,
            userType: user.user_type,
            roles: user.roles || []
        };

        return res.json({
            success: true,
            message: "Account created successfully",
            userType: user.user_type
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

        if (!email || !password) {
            return res.json({ success: false, message: "Missing fields" });
        }

        const emailNormalized = email.toLowerCase().trim();

        const user = await User.findOne({ user_email: emailNormalized });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.user_password);

        if (!match) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // ================= SESSION LOGIN =================
        req.session.user = {
            id: user._id,
            name: user.user_name,
            email: user.user_email,
            userType: user.user_type,
            roles: user.roles || []
        };

        return res.json({
            success: true,
            message: "Login successful",
            roles: user.roles || [],
            userType: user.user_type
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


// ================= LOGOUT =================
router.post('/logout', (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.error("LOGOUT ERROR:", err);
            return res.json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("connect.sid"); // session cookie

        return res.json({
            success: true,
            message: "Logged out"
        });
    });
});

module.exports = router;