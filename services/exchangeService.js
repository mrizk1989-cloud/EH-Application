const ExchangeRate = require('../models/ExchangeRate');

/**
 * Convert any currency → SAR
 * STRICT MODE (no fallback)
 */
async function convertToSAR(amount, fromCurrency) {

    if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
    }

    if (fromCurrency === "SAR") {
        return {
            originalAmount: amount,
            convertedAmount: amount,
            rate: 1,
            currency: "SAR"
        };
    }

    const rateDoc = await ExchangeRate.findOne({
        fromCurrency,
        toCurrency: "SAR"
    });

    if (!rateDoc) {
        throw new Error(`Missing exchange rate: ${fromCurrency} → SAR`);
    }

    const converted = amount * rateDoc.rate;

    return {
        originalAmount: amount,
        convertedAmount: converted,
        rate: rateDoc.rate,
        currency: "SAR"
    };
}

/**
 * Batch conversion for request items
 */
async function convertItemsToSAR(items = []) {

    const results = [];

    for (const item of items) {

        const converted = await convertToSAR(
            Number(item.amount),
            item.currency
        );

        results.push({
            ...item,
            amountSAR: converted.convertedAmount,
            exchangeRate: converted.rate
        });
    }

    return results;
}

module.exports = {
    convertToSAR,
    convertItemsToSAR
};