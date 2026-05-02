const express = require('express');
const router = express.Router();

const ExpenseType = require('../models/ExpenseType');
const { verifyToken } = require('../middleware/auth');

// ================= GET ALL EXPENSE TYPES =================
router.get('/', verifyToken, async (req, res) => {
    try {

        const data = await ExpenseType.find({ isActive: true })
            .sort({ name: 1 });

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;