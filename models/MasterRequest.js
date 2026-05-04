const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: String,
    public_id: String,
    type: String,
    originalName: String
}, { _id: false });

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
        enum: ['pending', 'in_progress', 'approved', 'rejected', 'canceled'],
        default: 'pending',
        index: true
    },

    currentRole: {
        type: String,
        enum: ['budget_control', 'direct_manager', 'bi', 'vp_finance', null],
        default: 'budget_control'
    },

    // ✅ FIXED (EXPLICIT)
    attachments: [attachmentSchema]

}, { timestamps: true });

module.exports = mongoose.model('MasterRequest', masterRequestSchema);