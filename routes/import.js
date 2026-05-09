const express = require("express");
const router = express.Router();

const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const mongoose = require("mongoose");

// ================= MIDDLEWARES =================
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { adminLimiter } = require("../middleware/rateLimiter");

// ================= ENV =================
const useTx = process.env.MONGO_TRANSACTIONS === "true";

// ================= UPLOAD =================
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

// =====================================================
// GET COLLECTIONS
// =====================================================
router.get(
    "/collections",
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        try {

            const db = mongoose.connection.db;

            const collections =
                await db.listCollections().toArray();

            const hidden = [
                "__Migration",
                "__Seed"
            ];

            const result = collections
                .map(c => c.name)
                .filter(name => !hidden.includes(name))
                .map(name => ({
                    value: name,
                    label: name
                }));

            res.json({
                success: true,
                collections: result
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);

// =====================================================
// GET FIELDS
// =====================================================
router.get(
    "/fields/:collection",
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        try {

            const db = mongoose.connection.db;

            const sample =
                await db
                    .collection(req.params.collection)
                    .findOne({});

            const fields = sample
                ? Object.keys(sample)
                : [];

            const cleaned = fields.filter(f =>
                ![
                    "_id",
                    "__v",
                    "createdAt",
                    "updatedAt"
                ].includes(f)
            );

            res.json({
                success: true,
                fields: cleaned
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);

// =====================================================
// CSV PREVIEW
// =====================================================
// ================= CSV PREVIEW =================
router.post(
    "/preview",
    verifyToken,
    requireAdmin,
    adminLimiter,
    upload.single("file"),
    async (req, res) => {

        try {

            const results = [];

            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on("data", row => {

                    // ================= REMOVE BOM =================

                    const cleanedRow = {};

                    Object.keys(row).forEach(key => {

                        const cleanKey =
                            key.replace(/^\uFEFF/, "").trim();

                        cleanedRow[cleanKey] = row[key];

                    });

                    results.push(cleanedRow);

                })
                .on("end", () => {

                    fs.unlinkSync(req.file.path);

                    res.json({
                        success: true,
                        preview: results.slice(0, 20),
                        fullData: results,
                        columns: Object.keys(results[0] || {})
                    });

                });

        } catch (err) {

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);

// =====================================================
// VALIDATE + DUPLICATE CHECK
// =====================================================
router.post(
    "/confirm",
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        try {

            const {
                mapping,
                data,
                collection,
                duplicateField
            } = req.body;

            const db = mongoose.connection.db;

            const col =
                db.collection(collection);

            const prepared = [];

            const duplicatesInCSV = [];
            const duplicatesInDB = [];

            const seen = new Set();

            for (const row of data) {

                const doc = {};

                for (const [csvCol, dbField]
                    of Object.entries(mapping)) {

                    if (dbField) {
                        doc[dbField] = row[csvCol];
                    }
                }

                prepared.push(doc);

                // ================= DUPLICATE CHECK =================

                if (duplicateField) {

                    const value =
                        String(
                            doc[duplicateField] || ""
                        ).trim();

                    if (value) {

                        // CSV duplicates
                        if (seen.has(value)) {

                            if (
                                !duplicatesInCSV.includes(value)
                            ) {
                                duplicatesInCSV.push(value);
                            }

                        } else {

                            seen.add(value);

                        }

                        // DB duplicates
                        const exists =
                            await col.findOne({
                                [duplicateField]: value
                            });

                        if (exists) {

                            if (
                                !duplicatesInDB.includes(value)
                            ) {
                                duplicatesInDB.push(value);
                            }

                        }
                    }
                }
            }

            res.json({
                success: true,
                total: prepared.length,
                prepared,
                duplicatesInCSV,
                duplicatesInDB
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);

// =====================================================
// EXECUTE IMPORT
// =====================================================
router.post(
    "/execute",
    verifyToken,
    requireAdmin,
    adminLimiter,
    async (req, res) => {

        let session = null;

        try {

            const {
                collection,
                docs,
                dryRun = false,
                duplicateField,
                skipDuplicates = false
            } = req.body;

            const db = mongoose.connection.db;

            const col =
                db.collection(collection);

            if (!Array.isArray(docs) || !docs.length) {

                return res.status(400).json({
                    success: false,
                    message: "No documents"
                });

            }

            // ================= DRY RUN =================

            if (dryRun) {

                return res.json({
                    success: true,
                    inserted: 0,
                    total: docs.length,
                    progress: 100,
                    message: "Dry run successful"
                });

            }

            let inserted = 0;

            const CHUNK = 100;

            if (useTx) {

                session =
                    await mongoose.startSession();

                session.startTransaction();

            }

            const seen = new Set();

            for (
                let i = 0;
                i < docs.length;
                i += CHUNK
            ) {

                const chunk =
                    docs.slice(i, i + CHUNK);

                const filtered = [];

                for (const doc of chunk) {

                    // ================= SKIP DUPLICATES =================

                    if (
                        skipDuplicates &&
                        duplicateField
                    ) {

                        const value =
                            String(
                                doc[duplicateField] || ""
                            ).trim();

                        if (!value) continue;

                        // Duplicate inside CSV
                        if (seen.has(value)) {
                            continue;
                        }

                        seen.add(value);

                        // Duplicate inside DB
                        const exists =
                            await col.findOne({
                                [duplicateField]: value
                            });

                        if (exists) {
                            continue;
                        }
                    }

                    filtered.push(doc);
                }

                if (!filtered.length) {
                    continue;
                }

                const ops = filtered.map(doc => ({
                    insertOne: {
                        document: doc
                    }
                }));

                if (useTx) {

                    await col.bulkWrite(
                        ops,
                        { session }
                    );

                } else {

                    await col.bulkWrite(ops);

                }

                inserted += filtered.length;
            }

            if (useTx) {

                await session.commitTransaction();

                session.endSession();

            }

            res.json({
                success: true,
                inserted,
                total: docs.length,
                progress: 100
            });

        } catch (err) {

            if (session) {

                await session.abortTransaction();

                session.endSession();

            }

            res.status(500).json({
                success: false,
                message: err.message
            });

        }
    }
);

module.exports = router;