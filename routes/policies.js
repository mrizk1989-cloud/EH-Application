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

// ================= CLOUDINARY UPLOAD =================
function uploadPDF(buffer, originalName, mimeType) {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "devPolicy",
                resource_type: "raw", // ✅ FIXED for PDF
                public_id: `${Date.now()}_${originalName}`
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
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
                    file.originalname,
                    file.mimetype
                );

                attachments.push({
                    url: uploaded.secure_url || uploaded.url,
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

            console.error("UPLOAD ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Policy upload failed"
            });
        }
    }
);

// ================= GET ALL POLICIES =================
router.get(
    "/",
    verifyToken,

    async (req, res) => {

        const data = await Policy.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data
        });
    }
);

// ================= UPDATE POLICY =================
router.post(
    "/update/:id",

    adminLimiter,
    verifyToken,
    requireAdmin,

    upload.single("file"),
    validateFileUpload,
    detectSuspiciousFile,

    async (req, res) => {

        try {

            const policy = await Policy.findById(req.params.id);

            if (!policy) {
                return res.status(404).json({
                    success: false,
                    message: "Policy not found"
                });
            }

            const {
                policyName,
                effectiveDate
            } = req.body;

            policy.policyName = policyName;
            policy.effectiveDate = effectiveDate;

            // ================= REPLACE FILE =================
            if (req.file) {

                const uploaded = await uploadPDF(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype
                );

                policy.attachments = [{
                    url: uploaded.secure_url || uploaded.url,
                    public_id: uploaded.public_id,
                    type: "pdf",
                    originalName: req.file.originalname,
                    extension: ".pdf",
                    mimeType: req.file.mimetype
                }];
            }

            await policy.save();

            return res.json({
                success: true,
                message: "Policy updated successfully",
                data: policy
            });

        } catch (err) {

            console.error("UPDATE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Update failed"
            });
        }
    }
);

// ================= DELETE POLICY =================
router.delete(
    "/:id",

    adminLimiter,
    verifyToken,
    requireAdmin,

    async (req, res) => {

        try {

            await Policy.findByIdAndDelete(req.params.id);

            return res.json({
                success: true,
                message: "Policy deleted successfully"
            });

        } catch (err) {

            console.error("DELETE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Delete failed"
            });
        }
    }
);

module.exports = router;