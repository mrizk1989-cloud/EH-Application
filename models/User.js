const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    user_type: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',   // ✅ auto assign "user"
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
        trim: true
    },

    user_password: {
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);