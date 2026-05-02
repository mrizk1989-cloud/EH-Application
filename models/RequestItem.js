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

    amount: {
        type: Number,
        required: true
    },

    currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
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

    directManagerApproval: { type: Boolean, default: null },
    directManagerNotes: { type: String, default: "" },

    biVpFinanceApproval: { type: Boolean, default: null },
    biVpFinanceNotes: { type: String, default: "" }

}, { timestamps: true });

module.exports = mongoose.model('RequestItem', RequestItemSchema);