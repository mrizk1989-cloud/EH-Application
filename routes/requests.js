const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requestLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');

const MasterRequest = require('../models/MasterRequest');
const RequestItem = require('../models/RequestItem'); // 🔥 NEW (IMPORTANT)

const {
    getNextMasterRequestNumber,
    generateSubRequestNumbers
} = require('../services/requestNumberService');

const {
    convertItemsToSAR
} = require('../services/exchangeService');

// ================= CREATE REQUEST =================
router.post(
    '/submit',
    verifyToken,
    requestLimiter,
    validateRequest,
    async (req, res) => {

        try {
            const sessionUser = req.session?.user;

            if (!sessionUser?.id) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No request items provided"
                });
            }

            // ✅ ADD THIS (YOU MISSED IT)
            const requestNo = await getNextMasterRequestNumber();

            const rawItems = items.map(i => ({
                customerId: i.customerId,
                amount: i.amount,
                currency: i.currency,
                expenseType: i.expenseType,
                purpose: i.purpose,
                doctorName: i.doctorName,
                requestPeriodMonth: i.requestPeriodMonth,
                requestPeriodYear: i.requestPeriodYear
            }));

            // ================= CONVERT TO SAR =================
            const convertedItems = await convertItemsToSAR(rawItems);

            // ================= ADD SUB REQUEST NUMBERS =================
            const finalItems = generateSubRequestNumbers(
                requestNo,
                convertedItems
            );

            // ================= CREATE MASTER =================
            // ================= CREATE MASTER =================
            const master = await MasterRequest.create({ // 🔥 CHANGED (was new + save)
                requestNo,
                userId: sessionUser.id,
                userName: sessionUser.userName || "Unknown",
                totalAmountSAR: 0,
                status: "pending",
                currentRole: "budget_control"
            });

            // ================= CREATE ITEMS (NEW LOGIC) =================
            const itemsToInsert = finalItems.map(i => ({
                ...i,
                requestId: master._id // 🔥 LINK MASTER → ITEM
            }));

            await RequestItem.insertMany(itemsToInsert); // 🔥 NEW

            // ================= CALCULATE TOTAL =================
            const total = itemsToInsert.reduce(
                (sum, i) => sum + (i.amountSAR || 0),
                0
            );

            // ================= UPDATE MASTER TOTAL =================
            master.totalAmountSAR = total; // 🔥 CHANGED (was inside schema before)
            await master.save();

            return res.json({
                success: true,
                message: "Request submitted successfully",
                requestNo
            });

        } catch (err) {

            console.error("REQUEST ERROR:", err);

            return res.status(500).json({
                success: false,
                message: err.message || "Server error"
            });
        }
    }
);

// ================= GET MY REQUESTS =================
router.get('/my', verifyToken, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const requests = await MasterRequest.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ================= GET REQUEST ITEMS (NEW) =================
router.get('/requests/:id/items', verifyToken, async (req, res) => {
    try {

        const items = await RequestItem.find({ // 🔥 NEW
            requestId: req.params.id
        });

        res.json({
            success: true,
            items
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;