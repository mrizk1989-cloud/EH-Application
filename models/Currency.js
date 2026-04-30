const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            unique: true
        },

        name: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Currency', currencySchema);