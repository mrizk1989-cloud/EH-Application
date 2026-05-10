const express = require("express");
const router = express.Router();
const { exportToExcel } = require("../services/excelExportService");
const mappers = require("../services/exportMappers");

// MODELS
const Counter = require("../models/Counter");
const Currency = require("../models/Currency");
const Customers = require("../models/Customers");
const ExchangeRate = require("../models/ExchangeRate");
const ExpenseType = require("../models/ExpenseType");
const MasterRequest = require("../models/MasterRequest");
const RequestItem = require("../models/RequestItem");
const UploadLog = require("../models/UploadLog");
const User = require("../models/User");
const EHPerformance = require("../models/EHPerformance");
const EHPolicy = require("../models/EHPolicy");


// ================= COLLECTION MAP =================
const collections = {
    counters: Counter,
    currencies: Currency,
    customers: Customers,
    exchangeRates: ExchangeRate,
    expenseTypes: ExpenseType,
    masterRequests: MasterRequest,
    requestItems: RequestItem,
    uploadLogs: UploadLog,
    users: User,
    EHPerformance: EHPerformance,
    EHPolicy: EHPolicy,
};

// ================= EXPORT =================
router.get("/:collection", async (req, res) => {
    try {
        const { collection } = req.params;

        const Model = collections[collection];

        if (!Model) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection"
            });
        }

        const raw = await Model.find().lean();

        const mapper = mappers[collection];

        const data = mapper
            ? raw.map(mapper)
            : raw;

        const { buffer, fileName } = await exportToExcel({
            data,
            fileName: collection
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}.xlsx`
        );

        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Export failed"
        });
    }
});

module.exports = router;