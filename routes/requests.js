const express = require('express');
const router = express.Router();
const multer = require("multer");
const { fileTypeFromBuffer } = require('file-type');
const path = require("path");

const {
    validateFileUpload,
    detectSuspiciousFile,
    logUpload
} = require('../middleware/fileSecurity');

const allowedExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".eml",
    ".msg"
];

const allowedMimeTypes = [
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "message/rfc822", // .eml (sometimes)
    "application/octet-stream" // fallback for msg/eml/office files
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {

        const ext = path.extname(file.originalname).toLowerCase();

        const isValidMime = allowedMimeTypes.includes(file.mimetype);
        const isValidExt = allowedExtensions.includes(ext);

        if (isValidMime || isValidExt) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only PDF, images, Office files, and Outlook emails allowed"));
        }
    }
});


const { verifyToken } = require('../middleware/auth');
const { requestLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validateRequest');

const { uploadToCloudinary } = require('../services/cloudinaryService');

const MasterRequest = require('../models/MasterRequest');
const RequestItem = require('../models/RequestItem'); // 🔥 NEW (IMPORTANT)

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const {
    getNextMasterRequestNumber,
    generateSubRequestNumbers
} = require('../services/requestNumberService');

const {
    convertItemsToSAR
} = require('../services/exchangeService');

// ================= CREATE REQUEST =================
router.post(
    '/submit',
    verifyToken,
    requestLimiter,
    upload.array("files"),
    validateFileUpload,
    detectSuspiciousFile,
    logUpload,
    async (req, res) => {

        try {
            const sessionUser = req.session?.user;

            if (!sessionUser?.id) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            let items;

            try {
                items = JSON.parse(req.body.items);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid items format"
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No request items provided"
                });
            }

            // ✅ ADD THIS (YOU MISSED IT)
            const requestNo = await getNextMasterRequestNumber();

            const files = req.files || [];
            const uploadedFiles = [];

            for (const file of files) {

                const ext = path.extname(file.originalname).toLowerCase();

                // 1. EXTENSION CHECK
                if (!allowedExtensions.includes(ext)) {
                    return res.status(400).json({
                        success: false,
                        message: `File type not allowed: ${file.originalname}`
                    });
                }

                // 2. REAL FILE TYPE DETECTION (IMPORTANT SECURITY LAYER)
                const type = await fileTypeFromBuffer(file.buffer);

                if (type) {

                    const detectedMime = type.mime;

                    const allowedDetectedMimes = [
                        "application/pdf",

                        "image/jpeg",
                        "image/png",
                        "image/webp",

                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

                        "application/vnd.ms-powerpoint",
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

                        "message/rfc822"
                    ];

                    const blockedMimes = [
                        "application/x-msdownload",
                        "application/x-executable",
                        "application/x-dosexec",
                        "application/x-msdos-program"
                    ];

                    // ❌ Block executables
                    if (blockedMimes.includes(detectedMime)) {
                        return res.status(400).json({
                            success: false,
                            message: "Executable files are not allowed"
                        });
                    }

                    // ❌ Reject anything not in allowed list
                    if (!allowedDetectedMimes.includes(detectedMime)) {
                        return res.status(400).json({
                            success: false,
                            message: `Unsupported file content: ${detectedMime}`
                        });
                    }
                }

                // 3. Upload to Cloudinary
                const result = await uploadToCloudinary(file.buffer);

                uploadedFiles.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                    type: result.resource_type,
                    originalName: file.originalname
                });
            }



            const rawItems = items.map(i => ({
                customerId: i.customerId,
                amount: i.amount,
                currency: i.currency,
                expenseType: i.expenseType,
                purpose: i.purpose,
                doctorName: i.doctorName,
                requestPeriodMonth: i.requestPeriodMonth,
                requestPeriodYear: i.requestPeriodYear
            }));

            // ================= CONVERT TO SAR =================
            const convertedItems = await convertItemsToSAR(rawItems);

            // ================= ADD SUB REQUEST NUMBERS =================
            const finalItems = generateSubRequestNumbers(
                requestNo,
                convertedItems
            );

            // ================= CREATE MASTER =================
            // ================= CREATE MASTER =================
            const master = await MasterRequest.create({
                requestNo,
                userId: sessionUser.id,
                userName: sessionUser.userName || "Unknown",
                totalAmountSAR: 0,
                status: "pending",
                currentRole: "budget_control",
                attachments: uploadedFiles
            });

            master.attachments = uploadedFiles;
            await master.save();

            // ================= CREATE ITEMS (NEW LOGIC) =================
            const itemsToInsert = finalItems.map(i => ({
                ...i,
                requestId: master._id, // 🔥 LINK MASTER → ITEM

            }));

            await RequestItem.insertMany(itemsToInsert); // 🔥 NEW

            // ================= CALCULATE TOTAL =================
            const total = itemsToInsert.reduce(
                (sum, i) => sum + (i.amountSAR || 0),
                0
            );

            // ================= UPDATE MASTER TOTAL =================
            master.totalAmountSAR = total; // 🔥 CHANGED (was inside schema before)
            await master.save();

            return res.json({
                success: true,
                message: "Request submitted successfully",
                requestNo
            });

        } catch (err) {

            console.error("REQUEST ERROR:", err);

            return res.status(500).json({
                success: false,
                message: err.message || "Server error"
            });
        }
    }
);

// ================= GET MY REQUESTS =================
router.get('/my', verifyToken, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const requests = await MasterRequest.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ================= GET REQUEST ITEMS (NEW) =================
router.get('/requests/:id/items', verifyToken, async (req, res) => {
    try {

        const items = await RequestItem.find({ // 🔥 NEW
            requestId: req.params.id
        });

        res.json({
            success: true,
            items
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/my-detailed', verifyToken, async (req, res) => {
    try {

        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false });
        }

        const requests = await MasterRequest.find({
            userId
        }).sort({ createdAt: -1 });

        const result = [];

        for (const r of requests) {
            const items = await RequestItem.find({ requestId: r._id });

            result.push({
                ...r.toObject(),
                items
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/my/:id/items', verifyToken, async (req, res) => {
    try {

        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false });
        }

        const request = await MasterRequest.findOne({
            _id: req.params.id,
            userId
        });

        if (!request) {
            return res.status(403).json({ success: false });
        }

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

    } catch (err) {
        res.status(500).json({ success: false });
    }
});
module.exports = router;