const mongoose = require('mongoose');

const masterRequestSchema = new mongoose.Schema({

    requestNo: {
        type: String,
        unique: true,
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    userName: String,

    exchangeRate: Number,

    totalAmountSAR: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },

    currentRole: {
        type: String,
        enum: ['budget_control', 'direct_manager', 'bi', 'vp_finance', null],
        default: 'budget_control'
    }

}, { timestamps: true });

module.exports = mongoose.model('MasterRequest', masterRequestSchema);