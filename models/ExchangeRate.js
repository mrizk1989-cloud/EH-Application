const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema(
    {
        fromCurrency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        toCurrency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        rate: {
            type: Number,
            required: true,
            min: 0
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// prevent duplicate pairs (USD -> SAR only once)
exchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);