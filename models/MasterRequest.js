const mongoose = require('mongoose');
const requestItemSchema = require('./RequestItem');

const masterRequestSchema = new mongoose.Schema({

    requestNo: {
        type: String,
        unique: true,
        required: true
    },

    // ================= USER =================
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    userName: {
        type: String,
        trim: true
    },

    // ================= MASTER DATA =================
    exchangeRate: Number,

    totalAmountSAR: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'approved', 'rejected'],
        default: 'pending'
    },

    currentRole: {
        type: String,
        enum: ['budget_control', 'direct_manager', 'bi', 'vp_finance', null],
        default: 'budget_control'
    },

    // ================= WHO WORKED ON IT =================

    budgetController: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: String
    },

    directManager: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: String
    },

    biVpFinance: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: String
    },

    // ================= LINE ITEMS =================
    items: [requestItemSchema]

}, { timestamps: true });

module.exports = mongoose.model('MasterRequest', masterRequestSchema);