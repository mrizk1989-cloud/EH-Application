const path = require("path");
const crypto = require("crypto");
const { fileTypeFromBuffer } = require("file-type");
const UploadLog = require('../models/UploadLog');

/**
 * 1. VALIDATE FILE UPLOAD (basic security gate)
 */
async function validateFileUpload(req, res, next) {
    try {
        const files = req.files || [];

        if (!files.length) return next();

        const allowedExtensions = [
            ".pdf", ".jpg", ".jpeg", ".png", ".webp",
            ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".pptx",
            ".eml", ".msg"
        ];

        const blockedNames = ["..", "/", "\\"];

        for (const file of files) {

            // ❌ 1. filename sanity check
            if (blockedNames.some(b => file.originalname.includes(b))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid filename detected"
                });
            }

            // ❌ 2. extension check
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                return res.status(400).json({
                    success: false,
                    message: `File type not allowed: ${file.originalname}`
                });
            }

            // ❌ 3. empty file check
            if (!file.buffer || file.buffer.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Empty file not allowed"
                });
            }

            // ❌ 4. real file type check (anti fake extension)
            const type = await fileTypeFromBuffer(file.buffer);

            if (type) {
                const blocked = [
                    "application/x-msdownload",
                    "application/x-executable",
                    "application/x-dosexec",
                    "application/x-msdos-program"
                ];

                if (blocked.includes(type.mime)) {
                    return res.status(400).json({
                        success: false,
                        message: "Executable files are not allowed"
                    });
                }
            }
        }

        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "File validation error"
        });
    }
}

/**
 * 2. DETECT SUSPICIOUS FILES (light heuristic check)
 */
function detectSuspiciousFile(req, res, next) {
    try {
        const files = req.files || [];

        for (const file of files) {

            const name = file.originalname.toLowerCase();

            // ❌ double extension (invoice.pdf.exe)
            if (name.split(".").length > 2) {
                return res.status(400).json({
                    success: false,
                    message: "Suspicious file name detected"
                });
            }

            // ❌ common attack patterns
            const suspiciousPatterns = [
                ".exe", ".bat", ".cmd", ".js", ".vbs", ".ps1", ".sh"
            ];

            if (suspiciousPatterns.some(p => name.includes(p))) {
                return res.status(400).json({
                    success: false,
                    message: "Potentially unsafe file blocked"
                });
            }
        }

        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Suspicion detection error"
        });
    }
}

/**
 * 3. LOG UPLOADS (audit trail)
 */
async function logUpload(req, res, next) {

    const files = req.files || [];

    if (files.length === 0) return next();

    const logs = files.map(file => ({
        userId: req.session?.user?.id || null,
        fileName: file.originalname,
        size: file.size,
        ip: req.ip
    }));

    try {
        await UploadLog.insertMany(logs);
    } catch (err) {
        console.error("Upload log error:", err);
    }

    next();
}

module.exports = {
    validateFileUpload,
    detectSuspiciousFile,
    logUpload
};