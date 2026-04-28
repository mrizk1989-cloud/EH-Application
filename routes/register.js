
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 🔥 Basic validation
        if (!fullName || !email || !password) {
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        // 🔥 Password strength
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPassword.test(password)) {
            return res.json({
                success: false,
                message: "Password must be 8+ chars with uppercase, lowercase, and number"
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        let user;

        try {
            // 🔥 Create user (DB handles duplicates)
            user = await User.create({
                user_type: 'user',
                user_name: fullName,
                user_email: email,
                user_password: hashed
            });

        } catch (err) {
            // 🔥 Duplicate email handling
            if (err.code === 11000) {
                return res.json({
                    success: false,
                    message: "Email already exists"
                });
            }
            throw err;
        }

        // 🔐 Generate JWT
        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        // 🍪 Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.json({
            success: true,
            message: "Account created successfully"
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);

        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password required"
            });
        }

        const user = await User.findOne({
            user_email: email
        });

        if (!user) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const match = await bcrypt.compare(
            password,
            user.user_password
        );

        if (!match) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // 🔐 Generate JWT
        const token = jwt.sign(
            { id: user._id, role: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        // 🍪 Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });
        
        return res.json({
            success: true,
            message: "Login successful"
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        return res.json({
            success: false,
            message: "Server error"
        });
    }
});

// ================= LOGOUT =================
router.post('/logout', (req, res) => {
    res.clearCookie("token");
    
    return res.json({
        success: true,
        message: "Logged out successfully"
        
    });
});



module.exports = router;