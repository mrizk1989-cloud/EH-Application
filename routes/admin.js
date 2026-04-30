const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminLimiter } = require('../middleware/rateLimiter');

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');
const ExchangeRate = require('../models/ExchangeRate');
const Currency = require('../models/Currency');
const ExpenseType = require('../models/ExpenseType');

// ================= ADMIN PAGE =================
router.get('/', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});

// ================= USERS =================
router.get('/users', verifyToken, requireAdmin, adminLimiter, async (req, res) => {
    const users = await User.find().select('-user_password');
    res.json(users);
});

// ✅ DELETE USER (MISSING BEFORE)
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ================= REQUESTS =================
router.get('/requests', verifyToken, requireAdmin, adminLimiter, async (req, res) => {
    res.json(await MasterRequest.find());
});

// ================= SETTINGS =================
router.get('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.find());
});

router.get('/currencies', verifyToken, requireAdmin, async (req, res) => {
    res.json(await Currency.find());
});

router.get('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.find());
});

// ================= CREATE =================
router.post('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.create(req.body));
});

router.post('/currencies', verifyToken, requireAdmin, async (req, res) => {
    res.json(await Currency.create(req.body));
});

router.post('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.create(req.body));
});

module.exports = router;