const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60
        });

        return res.json({ success: true, message: "Account created successfully" });

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

        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60
        });

        return res.json({ success: true, message: "Login successful" });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});
module.exports = router;