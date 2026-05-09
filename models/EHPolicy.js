const mongoose = require("mongoose");

const ehPolicySchema = new mongoose.Schema({

    country: {
        type: String,
        required: true
    },

    territory: {
        type: String,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    budget: {
        type: Number,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("EHPolicy", ehPolicySchema);