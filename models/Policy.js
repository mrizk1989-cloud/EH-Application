const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: String,
    public_id: String,
    type: String,
    originalName: String,
    extension: String,   //  (".pdf", ".jpeg")
    mimeType: String     //  ("application/pdf", "image/jpeg")
}, { _id: false });

const policySchema = new mongoose.Schema({

    policyName: {
        type: String,
        required: true,
    },

    effectiveDate: {
        type: Date,
        default: Date.now
    },


    // ✅ FIXED (EXPLICIT)
    attachments: [attachmentSchema]

}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);

