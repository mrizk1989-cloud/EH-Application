const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');
const Currency = require('../models/Currency');
const ExchangeRate = require('../models/ExchangeRate');
const ExpenseType = require('../models/ExpenseType');
const RequestItem = require('../models/RequestItem');

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

        const { user_name, user_email, user_type, roles, password } = req.body;

        const updateData = {
            user_name: user_name?.trim(),
            user_email: user_email?.trim().toLowerCase(),
            user_type,
            roles: Array.isArray(roles) ? roles : []
        };

        // 🔐 PASSWORD HANDLING
        if (password) {

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            const hashed = await bcrypt.hash(password, 10);
            updateData.user_password = hashed;
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select("-user_password");

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
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
            totalAmountSAR: Number(req.body.totalAmountSAR || 0),
            status: req.body.status
        };

        const updated = await MasterRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

router.get('/requests', verifyToken, requireAdmin, async (req, res) => {
    try {

        const requests = await MasterRequest
            .find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Not found"
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const deleted = await MasterRequest.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Not found"
            });
        }

        // optional cleanup (IMPORTANT)
        await RequestItem.deleteMany({ requestId: req.params.id });

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.delete('/requests/items/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const item = await RequestItem.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        await recalcMasterTotal(item.requestId);

        res.json({
            success: true,
            message: "Item deleted"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.put('/requests/items/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const updated = await RequestItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        await recalcMasterTotal(updated.requestId);

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

async function recalcMasterTotal(requestId) {

    const items = await RequestItem.find({ requestId });

    const total = items.reduce((sum, i) => {
        return sum + (i.amountSAR || 0);
    }, 0);

    await MasterRequest.findByIdAndUpdate(requestId, {
        totalAmountSAR: total
    });
}

router.get('/requests/:id/items', verifyToken, requireAdmin, async (req, res) => {
    try {

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

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
    const data = await ExchangeRate.find();
    res.json({ success: true, data });
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
    const data = await ExpenseType.find();
    res.json({ success: true, data });
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