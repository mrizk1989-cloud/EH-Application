const { body, validationResult } = require('express-validator');

const validateRequest = [

    body('items')
        .isArray({ min: 1 })
        .withMessage('At least one request item is required'),

    body('items.*.customerId')
        .notEmpty()
        .withMessage('Customer ID is required')
        .isLength({ max: 50 })
        .withMessage('Customer ID too long'),

    body('items.*.amount')
        .notEmpty()
        .withMessage('Amount required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be valid'),

    body('items.*.currency')
        .isIn(['USD', 'SAR', 'EUR'])
        .withMessage('Invalid currency'),

    body('items.*.expenseType')
        .isIn(['medical', 'travel', 'other'])
        .withMessage('Invalid expense type'),

    body('items.*.purpose')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Purpose too long'),

    body('items.*.doctorName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Doctor name too long'),

    body('items.*.requestPeriodMonth')
        .isInt({ min: 1, max: 12 })
        .withMessage('Invalid month'),

    body('items.*.requestPeriodYear')
        .isInt({ min: 2020, max: 2100 })
        .withMessage('Invalid year'),

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