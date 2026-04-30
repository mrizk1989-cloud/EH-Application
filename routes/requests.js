const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requestLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');

const MasterRequest = require('../models/MasterRequest');

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

            const request = new MasterRequest({
                userId: sessionUser.id,
                customerId,
                amount,
                currency,
                expenseType,
                purpose,
                doctor,
                month,
                year
            });

            await request.save();

            return res.json({
                success: true,
                message: "Request submitted successfully"
            });

        } catch (err) {
            console.error("REQUEST ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

module.exports = router;