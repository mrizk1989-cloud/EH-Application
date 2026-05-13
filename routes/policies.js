const express = require("express");

const router = express.Router();

const Policy = require("../models/Policy");

const upload = require("../middleware/policyUpload");

const {
    verifyToken
} = require("../middleware/auth");

const {
    requireAdmin
} = require("../middleware/requireAdmin");

const {
    validateFileUpload,
    detectSuspiciousFile,
    logUpload
} = require("../middleware/fileSecurity");

const {
    adminLimiter
} = require("../middleware/rateLimiter");

const cloudinary = require("../config/cloudinary");

const streamifier = require("streamifier");

// ================= CLOUDINARY =================
function uploadPDF(buffer, originalName) {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(

            {
                folder: "devPolicy",
                resource_type: "image",
                format: "pdf",
                public_id: `${Date.now()}_${originalName}`
            },

            (error, result) => {

                if (error) return reject(error);

                resolve(result);
            }
        );

        streamifier
            .createReadStream(buffer)
            .pipe(stream);
    });
}

// ================= CREATE POLICY =================
router.post(

    "/upload",

    adminLimiter,

    verifyToken,

    requireAdmin,

    upload.array("files"),

    validateFileUpload,

    detectSuspiciousFile,

    logUpload,

    async (req, res) => {

        try {

            const {
                policyName,
                effectiveDate
            } = req.body;

            if (!policyName) {
                return res.status(400).json({
                    success: false,
                    message: "Policy name required"
                });
            }

            const attachments = [];

            for (const file of req.files) {

                const uploaded = await uploadPDF(
                    file.buffer,
                    file.originalname
                );

                attachments.push({

                    url: uploaded.secure_url,

                    public_id: uploaded.public_id,

                    type: "pdf",

                    originalName: file.originalname,

                    extension: ".pdf",

                    mimeType: file.mimetype
                });
            }

            const policy = await Policy.create({

                policyName,

                effectiveDate,

                attachments
            });

            return res.json({

                success: true,

                message: "Policy uploaded successfully",

                data: policy
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({

                success: false,

                message: "Policy upload failed"
            });
        }
    }
);

module.exports = router;