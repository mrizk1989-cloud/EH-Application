const express = require("express");
const router = express.Router();

const EHPolicy = require("../models/EHPolicy");
const EHPerformance = require("../models/EHPerformance");
const RequestItem = require("../models/RequestItem");

const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");

// ================= POLICY GET =================
router.get("/policy", verifyToken, requireAdmin, async (req, res) => {
    try {
        const data = await EHPolicy.find({});
        res.json({ success: true, policies: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= POLICY CREATE =================
router.post("/policy", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { country, territory, year, budget } = req.body;

        const updated = await EHPolicy.findOneAndUpdate(
            { country, territory, year },
            { country, territory, year, budget },
            { upsert: true, new: true }
        );

        res.json({ success: true, policy: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= POLICY DELETE =================
router.delete("/policy/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await EHPolicy.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= PERFORMANCE GET =================
router.get("/performance", verifyToken, requireAdmin, async (req, res) => {
    try {
        const data = await EHPerformance.find({});
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= PERFORMANCE CREATE =================
router.post("/performance", verifyToken, requireAdmin, async (req, res) => {
    try {
        const doc = await EHPerformance.create(req.body);
        res.json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ================= DASHBOARD =================
router.get("/dashboard", verifyToken, requireAdmin, async (req, res) => {
    try {

        const { year } = req.query;

        // LOAD DATA
        const policies = await EHPolicy.find(year ? { year: Number(year) } : {});
        const performance = await EHPerformance.find({});
        const requests = await RequestItem.find({});

        // YEARS
        const years = year
            ? [Number(year)]
            : [...new Set(policies.map(p => p.year))].sort((a, b) => a - b);

        // AREAS
        const areas = [...new Set(policies.map(p => p.territory))];

        const result = {};

        for (const y of years) {

            result[y] = [];

            for (const area of areas) {

                // POLICY
                const policy = policies.find(p =>
                    p.year === y &&
                    p.territory?.trim().toLowerCase() === area?.trim().toLowerCase()
                );

                const budget = policy?.budget || 0;

                // PERFORMANCE
                const perfRows = performance.filter(p => {

                    const perfYear = Number(
                        String(p.month || "").split("-")[1]
                    );

                    return (
                        p.territory?.trim().toLowerCase() ===
                        area?.trim().toLowerCase()
                        &&
                        perfYear === y
                    );
                });

                const latestPerf = perfRows.sort((a, b) =>
                    b.month.localeCompare(a.month)
                )[0];

                const performancePercent =
                    latestPerf?.performancePercent || 0;



                const availableBudget =
                    budget * (performancePercent / 100);

                // const totalDemo = perfRows.reduce((s, p) => s + (p.demoCount || 0), 0);

                // REQUESTS (FIXED — NO YEAR BUG)
                const areaRequests = requests.filter(r => {

                    const requestYear =
                        Number(r.requestPeriodYear);

                    return (
                        String(r.salesTerritory).trim().toLowerCase() ===
                        String(area).trim().toLowerCase()
                        &&
                        requestYear === y
                    );
                });

                // APPROVED ONLY
                const approvedRequests = areaRequests.filter(r =>
                    String(r.status).toLowerCase().trim() === "approved"
                );

                const approvedExpenses = approvedRequests.reduce(
                    (s, r) => s + (Number(r.amountSAR) || 0),
                    0
                );

                // REJECTED
                const rejectedRequests = areaRequests.filter(r =>
                    String(r.status).toLowerCase().trim() === "rejected"
                );

                const rejectedExpenses = rejectedRequests.reduce(
                    (s, r) => s + (Number(r.amountSAR) || 0),
                    0
                );

                // OPEN
                const openRequests = areaRequests.filter(r =>
                    String(r.status).toLowerCase().trim() === "in_progress"
                );

                const openExpenses = openRequests.reduce(
                    (s, r) => s + (Number(r.amountSAR) || 0),
                    0
                );

                const demoCost = perfRows.reduce(
                    (s, p) => s + (Number(p.demoCount) || 0),
                    0
                );

                const depreciation = perfRows.reduce(
                    (s, p) => s + (Number(p.depreciationAmount) || 0),
                    0
                );

                const remaining =
                    availableBudget
                    - approvedExpenses
                    - depreciation;

                const progress = availableBudget
                    ? (approvedExpenses / availableBudget) * 100
                    : 0;

                result[y].push({
                    area,
                    budget,
                    expenses: approvedExpenses,
                    depreciation,
                    remaining,
                    progress,
                    approvedCount: approvedRequests.length,
                    approvedAmount: approvedExpenses,
                    rejectedCount: rejectedRequests.length,
                    rejectedAmount: rejectedExpenses,
                    openCount: openRequests.length,
                    openAmount: openExpenses,
                    performancePercent,
                    availableBudget,
                });
            }
        }

        res.json({ success: true, data: result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// ================= DASHBOARD DETAILS =================
router.get("/dashboard/details", verifyToken, requireAdmin, async (req, res) => {
    try {

        const { area } = req.query;

        const requests = await RequestItem.find({});

        const filtered = requests.filter(r =>
            String(r.salesTerritory).trim().toLowerCase() ===
            String(area).trim().toLowerCase()
        );

        const approved = filtered.filter(r =>
            String(r.status).toLowerCase().trim() === "approved"
        );

        const rejected = filtered.filter(r =>
            String(r.status).toLowerCase().trim() === "rejected"
        );

        const open = filtered.filter(r =>
            String(r.status).toLowerCase().trim() === "in_progress"
        );

        res.json({
            success: true,
            data: {
                approvedCount: approved.length,
                approvedAmount: approved.reduce((s, r) => s + (Number(r.amountSAR) || 0), 0),

                rejectedCount: rejected.length,
                rejectedAmount: rejected.reduce((s, r) => s + (Number(r.amountSAR) || 0), 0),

                openCount: open.length,
                openAmount: open.reduce((s, r) => s + (Number(r.amountSAR) || 0), 0),

                subRequests: filtered.map(r => ({
                    subRequestNo: r.subRequestNo,
                    status: r.status,
                    amountSAR: r.amountSAR
                }))
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/policy/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { country, territory, year, budget } = req.body;

        const updated = await EHPolicy.findByIdAndUpdate(
            req.params.id,
            { country, territory, year, budget },
            { new: true }
        );

        res.json({ success: true, policy: updated });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/performance/:id", verifyToken, requireAdmin, async (req, res) => {
    try {

        const updated = await EHPerformance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({ success: true, data: updated });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= PERFORMANCE DELETE =================
router.delete("/performance/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await EHPerformance.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;