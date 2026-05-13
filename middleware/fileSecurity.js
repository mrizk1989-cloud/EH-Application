const path = require("path");
const { fileTypeFromBuffer } = require("file-type");
const UploadLog = require("../models/UploadLog");

// ================= HELPERS =================

// PDF structure check (%PDF header)
function isValidPDF(buffer) {
    if (!buffer || buffer.length < 5) return false;
    return buffer.toString("utf8", 0, 5) === "%PDF-";
}

// detect obvious EXE signature (MZ header)
function isWindowsExecutable(buffer) {
    if (!buffer || buffer.length < 2) return false;
    return buffer.toString("utf8", 0, 2) === "MZ";
}

// ================= 1. VALIDATE FILE UPLOAD =================
async function validateFileUpload(req, res, next) {
    try {
        const files = req.files || [];
        if (!files.length) return next();

        const allowedExtensions = [
            ".pdf", ".jpg", ".jpeg", ".png", ".webp"
        ];

        const blockedNames = ["..", "/", "\\"];

        for (const file of files) {

            // ❌ 1. filename safety
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
                    message: "Only PDF and images are allowed"
                });
            }

            // ❌ 3. empty file
            if (!file.buffer || file.buffer.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Empty file not allowed"
                });
            }

            // ❌ 4. fake PDF detection
            if (ext === ".pdf" && !isValidPDF(file.buffer)) {
                return res.status(400).json({
                    success: false,
                    message: "Corrupted or fake PDF detected"
                });
            }

            // ❌ 5. executable detection (renamed malware)
            if (isWindowsExecutable(file.buffer)) {
                return res.status(400).json({
                    success: false,
                    message: "Executable file detected"
                });
            }

            // ❌ 6. real MIME verification
            const type = await fileTypeFromBuffer(file.buffer);

            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: "Unknown or corrupted file type"
                });
            }

            const allowedMime = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowedMime.includes(type.mime)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type: ${type.mime}`
                });
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

// ================= 2. DETECT SUSPICIOUS FILES =================
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

            // ❌ dangerous extensions
            const suspiciousPatterns = [
                ".exe", ".bat", ".cmd", ".js", ".vbs", ".ps1", ".sh"
            ];

            if (suspiciousPatterns.some(p => name.includes(p))) {
                return res.status(400).json({
                    success: false,
                    message: "Unsafe file type blocked"
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

// ================= 3. LOG UPLOADS =================
async function logUpload(req, res, next) {
    const files = req.files || [];
    if (!files.length) return next();

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
