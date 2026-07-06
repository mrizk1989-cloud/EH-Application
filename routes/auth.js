const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

// ================= PASSWORD POLICY =================
function isStrongPassword(password) {
    // At least:
    // 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

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

        //  PASSWORD VALIDATION
        if (!isStrongPassword(password)) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters and include uppercase, lowercase, and a number"
            });
        }

        const emailNormalized = email.toLowerCase().trim();

        //  CHECK IF USER EXISTS (important)
        const existingUser = await User.findOne({ user_email: emailNormalized });
        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already registered"
            });
        }

        await User.create({
            user_type: 'user',
            user_name: fullName,
            user_email: emailNormalized,
            user_password: await bcrypt.hash(password, 10),
            roles: [],
            status: 'pending',
            mustChangePassword: false,
            
        });

        return res.json({
            success: true,
            message: "Account created"
        });

    } catch (err) {
        console.error(err);
        return res.json({
            success: false,
            message: err.message || "Server error"
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

        if (user.user_type !== "admin" && user.status !== "active") {
            return res.json({
                success: false,
                message: "Account not approved yet"
            });
        }

        //  CRITICAL: REGENERATE SESSION (prevents session fixation)
        req.session.regenerate((err) => {
            if (err) {
                console.error("SESSION REGENERATE ERROR:", err);
                return res.json({ success: false, message: "Session error" });
            }

            req.session.user = {
                id: user._id,
                userType: user.user_type,
                roles: user.roles || [],
                userName: user.user_name,
                status: user.status,
                userArea: user.area_section || [],
                country: user.country,
            };

            //  SAVE AFTER REGENERATE
            req.session.save((err) => {
                if (err) {
                    console.error("SESSION SAVE ERROR:", err);
                    return res.json({ success: false, message: "Session error" });
                }

                return res.json({
                    success: true,
                    roles: user.roles || [],
                    userType: user.user_type,
                    status: user.status,
                    userName: user.user_name,
                    userArea: user.area_section || [],
                    country: user.country,
                });
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

router.get('/me', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json({ success: false });
        }

        const user = await User.findById(req.session.user.id);

        res.json({
            success: true,
            user: {
                id: user._id,
                userName: user.user_name,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword
            }
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

// ================= CHANGE PASSWORD =================
router.post('/change-password', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.json({
                success: false,
                message: "All fields required"
            });
        }

        //  validate new password
        if (!isStrongPassword(newPassword)) {
            return res.json({
                success: false,
                message: "Weak password"
            });
        }

        const user = await User.findById(req.session.user.id);

        const match = await bcrypt.compare(currentPassword, user.user_password);

        if (!match) {
            return res.json({
                success: false,
                message: "Current password incorrect"
            });
        }

        user.user_password = await bcrypt.hash(newPassword, 10);

        //  remove forced reset flag
        user.mustChangePassword = false;

        await user.save();

        res.json({
            success: true,
            message: "Password updated"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;