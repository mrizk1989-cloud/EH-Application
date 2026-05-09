const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: String,
    public_id: String,
    type: String,
    originalName: String,
    extension: String,   // ✅ NEW (".pdf", ".jpeg")
    mimeType: String     // ✅ NEW ("application/pdf", "image/jpeg")
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

    userArea: [String],

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
        enum: ['direct_manager', 'budget_control', 'bi', 'vp_finance', 'finished', null],
        default: 'budget_control'
    },

    budget_control_comment: {
        type: String,
        default: 'no_comment'
    },

    direct_manager_comment: {
        type: String,
        default: 'no_comment'
    },

    budget_control_comment: {
        type: String,
        default: 'no_comment'
    },

  

    bi_comment: {
        type: String,
        default: 'no_comment'
    },

    vp_finance_comment: {
        type: String,
        default: 'no_comment'
    },

    // ✅ FIXED (EXPLICIT)
    attachments: [attachmentSchema]

}, { timestamps: true });

module.exports = mongoose.model('MasterRequest', masterRequestSchema);