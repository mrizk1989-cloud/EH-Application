const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    user_type: {
        type: String,
        enum: ['admin', 'user'],   // only these values allowed
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
        unique: true,              // no duplicate emails
        lowercase: true
    },

    user_password: {
        type: String,
        required: true
    }

}, { timestamps: true }); // adds createdAt & updatedAt

module.exports = mongoose.model('User', userSchema);