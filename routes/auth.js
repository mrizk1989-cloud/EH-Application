const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {

        const existing = await User.findOne({
            user_email: req.body.email
        });

        if (existing) {
            return res.json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashed = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            user_name: req.body.fullName,
            user_email: req.body.email,
            user_password: hashed
        });

        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,   // true in production HTTPS
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Account created successfully"
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
router.post('/login', async (req, res) => {
    try {

        const user = await User.findOne({
            user_email: req.body.email
        });

        if (!user) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const match = await bcrypt.compare(
            req.body.password,
            user.user_password
        );

        if (!match) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Login successful"
        });

    } catch (err) {
        console.error(err);

        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;