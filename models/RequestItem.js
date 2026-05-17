const mongoose = require('mongoose');

const RequestItemSchema = new mongoose.Schema({

    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterRequest',
        required: true,
        index: true
    },

    subRequestNo: String,
    customerId: String,
    customerName: String,
    salesTerritory: String,
    salesCountry: String,

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'approved', 'rejected', 'canceled'],
        default: 'pending',
        index: true
    },

    file: {
        url: String,
        public_id: String,
        name: String,
        type: String
    },

    expenseType: String,
    purpose: String,
    doctorName: String,

    requestPeriodMonth: Number,
    requestPeriodYear: Number,

    exchangeRate: Number,
    amountSAR: Number,

    idCheck: { type: Boolean, default: false },
    budgetCheck: { type: Boolean, default: false },

    directManagerApproval: { type: Boolean, default: false },
    directManagerNotes: { type: String, default: "" },

    biVpFinanceApproval: { type: Boolean, default: false },
    biVpFinanceNotes: { type: String, default: "" }

}, { timestamps: true });

module.exports = mongoose.model('RequestItem', RequestItemSchema);