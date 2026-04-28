// const express = require('express');
// const registerRouter = express.Router();
// const bcrypt = require('bcrypt');

// const User = require('../models/User');

// registerRouter.post('/register', async (req, res) => {
//     try {

//         // 🔍 check duplicate email
//         const existingUser = await User.findOne({
//             user_email: req.body.email
//         });

//         if (existingUser) {
//             req.flash('error', 'Email already exists');
//             return res.redirect('/');
//         }

//         // 🔐 hash password
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);

//         // ➕ create user
//         await User.create({
//             user_type: req.body.role,
//             user_name: req.body.fullName,
//             user_email: req.body.email,
//             user_password: hashedPassword
//         });

//         req.flash('success', 'Account created successfully');
//         return res.redirect('/');

//     } catch (err) {
//         console.error(err);
//         req.flash('error', 'Server error, please try again');
//         return res.redirect('/');
//     }
// });
// const router = express.Router();
const express = require('express');
const registerRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// ================= REGISTER =================
registerRouter.post('/register', async (req, res) => {
    try {

        const existing = await User.findOne({ user_email: req.body.email });

        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            user_type: 'user',
            user_name: req.body.fullName,
            user_email: req.body.email,
            user_password: hashedPassword
        });

        const token = jwt.sign(
            {
                id: user._id,
                name: user.user_name,
                role: user.user_type
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({
            message: 'Account created successfully',
            token
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = registerRouter;