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

// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     user_name: String,
//     user_email: String,
//     user_password: String,
//     user_type: { type: String, default: "user" }
// });

// module.exports = mongoose.model('User', userSchema);