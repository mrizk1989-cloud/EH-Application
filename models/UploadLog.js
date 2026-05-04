const mongoose = require('mongoose');

const uploadLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    fileName: String,
    size: Number,
    ip: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("UploadLog", uploadLogSchema);