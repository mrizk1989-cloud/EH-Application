
const { body, validationResult } = require('express-validator');

// ================= REQUEST VALIDATION =================
const validateRequest = [

    body('customerId.*')
        .trim()
        .notEmpty()
        .withMessage('Customer ID is required')
        .isLength({ max: 50 })
        .withMessage('Customer ID too long'),

    body('amount.*')
        .notEmpty()
        .withMessage('Amount required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a valid number'),

    body('currency.*')
        .isIn(['USD', 'SAR', 'EUR'])
        .withMessage('Invalid currency'),

    body('expenseType.*')
        .isIn(['medical', 'travel', 'other'])
        .withMessage('Invalid expense type'),

    body('purpose.*')
        .optional()
        .trim()
        .isLength({ max: 200 }),

    body('doctor.*')
        .optional()
        .trim()
        .isLength({ max: 100 }),

    (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        next();
    }
];

module.exports = { validateRequest };