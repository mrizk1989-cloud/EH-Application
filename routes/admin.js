const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

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
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    res.json(await User.find().select('-user_password'));
});

router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ================= REQUESTS =================
router.get('/requests', verifyToken, requireAdmin, async (req, res) => {
    res.json(await MasterRequest.find());
});

// ================= SETTINGS =================
router.get('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.find());
});

router.post('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.create(req.body));
});

router.get('/currencies', verifyToken, requireAdmin, async (req, res) => {
    res.json(await Currency.find());
});

router.post('/currencies', verifyToken, requireAdmin, async (req, res) => {
    res.json(await Currency.create(req.body));
});

router.get('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.find());
});

router.post('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.create(req.body));
});

module.exports = router;