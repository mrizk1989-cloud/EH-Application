const mongoose = require("mongoose");

const ehPerformanceSchema = new mongoose.Schema({

    territory: {
        type: String,
        required: true
    },

    month: {
        type: String, // "2025-01"
        required: true
    },

    performancePercent: {
        type: Number,
        required: true
    },

    demoCount: {
        type: Number,
        default: 0
    },

    depreciationAmount: {
    type: Number,
    default: 0
},

}, { timestamps: true });

module.exports = mongoose.model("EHPerformance", ehPerformanceSchema);