// const router = express.Router();
const express = require('express');
const loginRouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// ================= LOGIN =================
loginRouter.post('/login', async (req, res) => {
    try {

        const user = await User.findOne({ user_email: req.body.email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(req.body.password, user.user_password);

        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

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
            message: 'Login successful',
            token
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = loginRouter;