const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminLimiter } = require('../middleware/rateLimiter');

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');

// ================= ADMIN PAGE =================
router.get('/', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});

// ================= USERS =================
router.get('/users',
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        try {
            const users = await User.find().select('-user_password');
            return res.json(users);

        } catch (err) {
            console.error(err);
            return res.status(500).json([]);
        }
    }
);

// ================= REQUESTS =================
router.get('/requests',
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        try {
            const requests = await MasterRequest.find();
            return res.json(requests);

        } catch (err) {
            console.error(err);
            return res.status(500).json([]);
        }
    }
);

module.exports = router;