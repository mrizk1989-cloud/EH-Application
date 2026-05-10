const express = require("express");
const router = express.Router();
const { exportToExcel } = require("../services/excelExportService");
const mappers = require("../services/exportMappers");

const models = {
    counters: require("../models/Counter"),
    currencies: require("../models/Currency"),
    customers: require("../models/Customers"),
    exchangeRates: require("../models/ExchangeRate"),
    expenseTypes: require("../models/ExpenseType"),
    masterRequests: require("../models/MasterRequest"),
    requestItems: require("../models/RequestItem"),
    uploadLogs: require("../models/UploadLog"),
    users: require("../models/User"),
    EHPerformance: require("../models/EHPerformance"),
    EHPolicy: require("../models/EHPolicy"),
};

router.get("/:collection", async (req, res) => {

    try {
        const { collection } = req.params;

        const Model = models[collection];

        if (!Model) {
            return res.status(400).json({
                success: false,
                message: "Invalid collection"
            });
        }

        const user = req.session?.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const roles = user.roles || [];

        const isAdmin = roles.includes("admin");
        const isFinance = roles.includes("bi") || roles.includes("vp_finance");
        const isManager = roles.includes("direct_manager");
        const isSales = roles.includes("sales_manager");

        let query = {};

        // ================= RULE =================
        if (!isAdmin && collection !== "requestItems") {
            return res.status(403).json({
                success: false,
                message: "Only requestItems export allowed"
            });
        }

        if (!isAdmin && collection === "requestItems") {

            // ✅ FIX: support BOTH naming styles
            const areas = (user.area_section || user.userArea || [])
                .map(a => String(a).trim())
                .filter(Boolean);

            if (isFinance) {
                query = {};

            } else if (isManager || isSales) {

                // 🔥 IMPORTANT SAFETY CHECK
                if (areas.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No area_section assigned to user",
                        debug: user
                    });
                }

                query = {
                    salesTerritory: { $in: areas }
                };

            } else {
                query = { createdBy: user._id };
            }
        }

        const raw = await Model.find(query).lean();

        if (!raw || raw.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No data available for export",
                debug: {
                    roles,
                    area_section: user.area_section,
                    query
                }
            });
        }

        const mapper = mappers[collection];
        const data = mapper ? raw.map(mapper) : raw;

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

        return res.send(buffer);

    } catch (err) {
        console.error("EXPORT ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Export failed"
        });
    }
});

module.exports = router;