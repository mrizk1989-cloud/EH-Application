const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/', async (req, res) => {

    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ success: false });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ success: false });
        }

        const newAccessToken = jwt.sign(
            {
                id: user._id,
                roles: user.roles,
                userType: user.user_type
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000
        });

        return res.json({ success: true });

    } catch (err) {
        return res.status(403).json({ success: false });
    }
});

module.exports = router;