const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requestLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');

const MasterRequest = require('../models/MasterRequest');

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
            const sessionUser = req.user; // ✅ FIXED (consistent usage)

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

            // ================= REQUEST NUMBER =================
            const requestNo = await getNextMasterRequestNumber();

            // ================= NORMALIZE INPUT =================
            const rawItems = items.map(i => ({
                customerId: i.customerId,
                amount: i.amount,
                currency: i.currency,
                expenseType: i.expenseType,
                purpose: i.purpose,

                // ✅ FIX: consistent naming
                doctorName: i.doctorName,

                requestPeriodMonth: i.requestPeriodMonth,
                requestPeriodYear: i.requestPeriodYear
            }));

            // ================= CONVERT TO SAR =================
            const convertedItems = await convertItemsToSAR(rawItems);

            // ================= SUB REQUEST NUMBERS =================
            const finalItems = generateSubRequestNumbers(
                requestNo,
                convertedItems
            );

            // ================= SAVE MASTER REQUEST =================
            const request = new MasterRequest({
                requestNo,
                userId: sessionUser.id,
                userName: sessionUser.userName || "Unknown",
                items: finalItems,
                totalAmountSAR: finalItems.reduce(
                    (sum, i) => sum + (i.amountSAR || 0),
                    0
                ),
                status: "pending",
                currentRole: "budget_control"
            });

            await request.save();

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

        const userId = req.user.id; // ✅ FIXED

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

module.exports = router;