const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');
const Currency = require('../models/Currency');
const ExchangeRate = require('../models/ExchangeRate');
const ExpenseType = require('../models/ExpenseType');

// ================= ADMIN PAGE =================
router.get('/', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});


// ================= USERS =================
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    const users = await User.find().select('-user_password');
    res.json(users);
});

router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { user_name, user_email, user_type, roles } = req.body;

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            {
                user_name,
                user_email,
                user_type,
                roles
            },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


// ================= REQUESTS =================


router.put('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const updateData = {
            requestNo: req.body.requestNo,
            userName: req.body.userName,
            totalAmountSAR: req.body.totalAmountSAR,
            status: req.body.status,
        };

        const updated = await MasterRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select("-user_password");

        if (!updated) {
            return res.status(404).json({ success: false });
        }

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/requests', verifyToken, requireAdmin, async (req, res) => {

    const requests = await MasterRequest
        .find()
        .sort({ createdAt: -1 });

    res.json(requests);
});

router.get('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    const request = await MasterRequest.findById(req.params.id);
    res.json(request);
});

router.delete('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const deleted = await MasterRequest.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});


// ================= CURRENCIES =================
// ================= CURRENCIES (FIXED SAFE VERSION) =================
router.get('/currencies', verifyToken, requireAdmin, async (req, res) => {
    const data = await Currency.find().sort({ createdAt: -1 });
    res.json(data);
});

router.post('/currencies', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { country, code, name } = req.body;

        if (!country || !code) {
            return res.status(400).json({
                success: false,
                message: "Country and Code are required"
            });
        }

        const exists = await Currency.findOne({ code: code.toUpperCase() });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Currency already exists"
            });
        }

        const created = await Currency.create({
            country: country.trim(),
            code: code.trim().toUpperCase(),
            name: name?.trim() || ""
        });

        return res.json({
            success: true,
            data: created
        });

    } catch (err) {
        console.error("CURRENCY CREATE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while creating currency"
        });
    }
});

router.put('/currencies/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const updated = await Currency.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/currencies/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await Currency.findByIdAndDelete(req.params.id);
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});


// ================= RATES =================
router.get('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.find());
});

router.post('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.create(req.body));
});

router.put('/rates/:id', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

router.delete('/rates/:id', verifyToken, requireAdmin, async (req, res) => {
    await ExchangeRate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


// ================= EXPENSE TYPES =================
router.get('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.find());
});

router.post('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.create(req.body));
});

router.put('/expense-types/:id', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

router.delete('/expense-types/:id', verifyToken, requireAdmin, async (req, res) => {
    await ExpenseType.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;