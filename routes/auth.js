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
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        const emailNormalized = email.toLowerCase().trim();

        await User.create({
            user_type: 'user',
            user_name: fullName,
            user_email: emailNormalized,
            user_password: await bcrypt.hash(password, 10),
            roles: []
        });

        return res.json({
            success: true,
            message: "Account created"
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= LOGIN =================
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            user_email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.user_password);

        if (!match) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        req.session.user = {
            id: user._id,
            userType: user.user_type,
            roles: user.roles || []
        };

        // ✅ FORCE SAVE (VERY IMPORTANT)
        req.session.save((err) => {
            if (err) {
                console.error("SESSION SAVE ERROR:", err);
                return res.json({ success: false, message: "Session error" });
            }

            return res.json({
                success: true,
                roles: user.roles || [],
                userType: user.user_type
            });
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= LOGOUT =================
router.post('/logout', (req, res) => {

    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Logout error"
            });
        }

        res.clearCookie('connect.sid');

        return res.json({
            success: true,
            message: "Logged out"
        });
    });
});

module.exports = router;