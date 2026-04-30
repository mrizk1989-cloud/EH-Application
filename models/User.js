const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    user_type: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
        required: true
    },

    user_name: {
        type: String,
        required: true,
        trim: true
    },

    user_email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },

    user_password: {
        type: String,
        required: true
    },

    // ✅ SCALABLE ROLE SYSTEM (IMPORTANT CHANGE)
    roles: {
        type: [String],
        enum: ['admin', 'sales_manager', 'budget_control', 'direct_manager', 'bi', 'vp_finance'],
        default: []
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);