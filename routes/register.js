const express = require('express');
const registerRouter = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');

registerRouter.post('/register', async (req, res) => {
    try {

        // 🔍 check duplicate email
        const existingUser = await User.findOne({
            user_email: req.body.email
        });

        if (existingUser) {
            req.flash('error', 'Email already exists');
            return res.redirect('/');
        }

        // 🔐 hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // ➕ create user
        await User.create({
            user_type: req.body.role,
            user_name: req.body.fullName,
            user_email: req.body.email,
            user_password: hashedPassword
        });

        req.flash('success', 'Account created successfully');
        return res.redirect('/');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error, please try again');
        return res.redirect('/');
    }
});

module.exports = registerRouter;