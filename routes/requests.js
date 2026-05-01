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
            const sessionUser = req.session?.user;

            if (!sessionUser?.id) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const {
                customerId,
                amount,
                currency,
                expenseType,
                purpose,
                doctor,
                month,
                year
            } = req.body;

            // ================= MASTER REQUEST NUMBER =================
            const requestNo = await getNextMasterRequestNumber();

            // ================= BUILD ITEMS =================
            const rawItems = Array.isArray(customerId)
                ? customerId.map((_, i) => ({
                    customerId: customerId[i],
                    amount: amount[i],
                    currency: currency[i],
                    expenseType: expenseType[i],
                    purpose: purpose[i],
                    doctor: doctor[i],
                    requestPeriodMonth: month[i],
                    requestPeriodYear: year[i]
                }))
                : [];

            // ================= CONVERT TO SAR =================
            const convertedItems = await convertItemsToSAR(rawItems);

            // ================= ADD SUB REQUEST NUMBERS =================
            const finalItems = generateSubRequestNumbers(
                requestNo,
                convertedItems
            );

            // ================= CREATE MASTER =================
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

module.exports = router;