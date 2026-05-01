const mongoose = require('mongoose');
const requestItemSchema = require('./RequestItem');

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

    userName: {
        type: String,
        trim: true
    },

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
        default: 'budget_control',
        index: true
    },

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

    items: [requestItemSchema]

}, { timestamps: true });

/* ================= PERFORMANCE INDEXES ================= */

// 🔥 fast lookup by user
masterRequestSchema.index({ userId: 1, createdAt: -1 });

// 🔥 admin dashboard filtering
masterRequestSchema.index({ status: 1, createdAt: -1 });

// 🔥 workflow tracking
masterRequestSchema.index({ currentRole: 1, status: 1 });

// 🔥 request search
masterRequestSchema.index({ requestNo: 1 });

// 🔥 date range queries (reports)
masterRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MasterRequest', masterRequestSchema);