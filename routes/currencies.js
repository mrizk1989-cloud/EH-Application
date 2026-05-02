const express = require('express');
const router = express.Router();

const ExchangeRate = require('../models/ExchangeRate');
const { verifyToken } = require('../middleware/auth');

/**
 * GET ALL AVAILABLE CURRENCIES (FROM EXCHANGE RATE TABLE)
 * This ensures dropdown is ALWAYS synced with rates
 */
router.get('/', verifyToken, async (req, res) => {
    try {

        const rates = await ExchangeRate.find({ toCurrency: "SAR" });

        // extract unique currencies
        const currenciesSet = new Set();

        rates.forEach(r => {
            currenciesSet.add(r.fromCurrency);
        });

        // ALWAYS include SAR
        currenciesSet.add("SAR");

        const currencies = Array.from(currenciesSet).map(c => ({
            code: c,
            name: c
        }));

        return res.json({
            success: true,
            currencies
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to load currencies"
        });
    }
});

module.exports = router;