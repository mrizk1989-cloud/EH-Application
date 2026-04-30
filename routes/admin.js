const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');


// ================= ADMIN PAGE =================
router.get('/', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});


// ================= USERS API =================
router.get('/users', verifyToken, requireAdmin, async (req, res) => {

    try {
        const users = await User.find().select('-user_password');

        return res.json(users);

    } catch (err) {
        console.error("ADMIN USERS ERROR:", err);

        return res.status(500).json([]);
    }
});


// ================= REQUESTS API =================
router.get('/requests', verifyToken, requireAdmin, async (req, res) => {

    try {
        const requests = await MasterRequest.find();

        return res.json(requests);

    } catch (err) {
        console.error("ADMIN REQUESTS ERROR:", err);

        return res.status(500).json([]);
    }
});


module.exports = router;