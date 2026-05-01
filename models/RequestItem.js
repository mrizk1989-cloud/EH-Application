const mongoose = require('mongoose');

const RequestItemSchema = new mongoose.Schema({

    

    subRequestNo: {
        type: String,
        required: true
    },

    customerId: {
        type: String,
        trim: true
    },

    customerName: {
        type: String,
        trim: true
    },

    salesTerritory: {
        type: String,
        trim: true
    },

    amount: {
        type: Number,
        required: true
    },

    currency: {
        type: String,
        enum: ['USD', 'SAR', 'EUR'],
        default: 'SAR'
    },

    expenseType: {
        type: String,
        trim: true
    },

    purpose: {
        type: String,
        trim: true
    },

    doctorName: {
        type: String,
        trim: true
    },

    requestPeriodMonth: Number,
    requestPeriodYear: Number,

    exchangeRate: Number,
    amountSAR: Number,

    // ================= BUDGET CONTROL =================
    idCheck: {
        type: Boolean,
        default: false
    },

    budgetCheck: {
        type: Boolean,
        default: false
    },

    // ================= DIRECT MANAGER =================
    directManagerApproval: {
        type: Boolean,
        default: null
    },

    directManagerNotes: {
        type: String,
        default: ""
    },

    // ================= BI / VP FINANCE =================
    biVpFinanceApproval: {
        type: Boolean,
        default: null
    },

    biVpFinanceNotes: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = RequestItemSchema;