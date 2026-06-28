const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { requireBudgetcontrole } = require('../middleware/requireBudgetcontrole');
const { requireDirectmanager } = require('../middleware/requireDirectmanager');
const { requireBiorVpfinance } = require('../middleware/requireBiorVpfinance');
const bcrypt = require('bcrypt');

const {
    attachRemainingBudgetToRequests
} = require("../services/budgetRemainingService");

const User = require('../models/User');
const MasterRequest = require('../models/MasterRequest');
const Currency = require('../models/Currency');
const ExchangeRate = require('../models/ExchangeRate');
const ExpenseType = require('../models/ExpenseType');
const RequestItem = require('../models/RequestItem');
const { convertToSAR } = require('../services/exchangeService');
const { buildApprovalMail } = require('../services/mailBuilder');


// ================= ADMIN PAGE =================
router.get('/', verifyToken, requireAdmin, (req, res) => {
    res.render('admin');
});


// ================= USERS =================
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    const users = await User.find().select('-user_password');
    res.json(users);
});

router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const { user_name, user_email, user_type, roles, status, password, country, area_section } = req.body;


        const updateData = {};

        if (user_name) updateData.user_name = user_name.trim();

        if (user_email) {
            updateData.user_email = user_email.trim().toLowerCase();
        }

        if (user_type) updateData.user_type = user_type;

        if (roles) {
            updateData.roles = Array.isArray(roles)
                ? roles.filter(r => r && r.trim())
                : [];
        }

        if (status) updateData.status = status;

        if (country) updateData.country = country;

        if (area_section) {
            updateData.area_section = Array.isArray(area_section)
                ? area_section.filter(e => e && e.trim())
                : [];
        }

        // 🔐 PASSWORD
        if (password && password.trim().length > 0) {

            if (password.trim().length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            const hashed = await bcrypt.hash(password.trim(), 10);
            updateData.user_password = hashed;

            // ✅ FORCE USER TO CHANGE PASSWORD
            updateData.mustChangePassword = true;
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select("-user_password");

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error("USER UPDATE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


// ================= REQUESTS =================


router.put('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const updateData = {
            requestNo: req.body.requestNo,
            userName: req.body.userName,
            // totalAmountSAR: Number(req.body.totalAmountSAR || 0),
            status: req.body.status
        };

        const updated = await MasterRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

router.get('/requests', verifyToken, requireAdmin, async (req, res) => {
    try {

        const {
            userName,
            status,
            currentRole,
            year
        } = req.query;

        const filter = {};

        if (userName) {
            filter.userName = userName;
        }

        if (status) {
            filter.status = status;
        }

        if (currentRole) {
            filter.currentRole = currentRole;
        }

        let requests = await MasterRequest
            .find(filter)
            .sort({ createdAt: -1 });

        // YEAR FILTER FROM REQUEST ITEMS
        if (year) {

            const requestItems = await RequestItem.find({
                requestPeriodYear: Number(year)
            });

            const requestIds = [
                ...new Set(
                    requestItems.map(i => String(i.requestId))
                )
            ];

            requests = requests.filter(r =>
                requestIds.includes(String(r._id))
            );
        }

        const data = await attachRemainingBudgetToRequests(requests);

        res.json({
            success: true,
            data
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });
    }
});

// ================= REQUEST FILTER DATA =================
router.get(
    '/requests/filters',
    verifyToken,
    requireAdmin,
    async (req, res) => {

        try {

            // MASTER REQUESTS
            const masterRequests = await MasterRequest.find();

            // REQUEST ITEMS
            const requestItems = await RequestItem.find();

            // USERS
            const users = [
                ...new Set(
                    masterRequests
                        .map(r => r.userName)
                        .filter(Boolean)
                )
            ].sort();

            // STATUS
            const statuses = [
                ...new Set(
                    masterRequests
                        .map(r => r.status)
                        .filter(Boolean)
                )
            ].sort();

            // CURRENT ROLE
            const roles = [
                ...new Set(
                    masterRequests
                        .map(r => r.currentRole)
                        .filter(Boolean)
                )
            ].sort();

            // YEARS (FROM REQUEST ITEMS)
            const years = [
                ...new Set(
                    requestItems
                        .map(r => Number(r.requestPeriodYear))
                        .filter(Boolean)
                )
            ].sort((a, b) => b - a);

            res.json({
                success: true,
                data: {
                    users,
                    statuses,
                    roles,
                    years
                }
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
);

router.get('/requests/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Not found"
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});


router.put('/requests/:id/cancel', verifyToken, requireAdmin, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (["approved", "rejected", "canceled"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: "Request cannot be canceled"
            });
        }

        // ✅ 1. Cancel master
        request.status = "canceled";

        await request.save();

        // ✅ 2. Cancel ALL items under it
        await RequestItem.updateMany(
            { requestId: request._id },
            { $set: { status: "canceled" } }
        );

        res.json({
            success: true,
            message: "Request canceled successfully"
        });

    } catch (err) {
        console.error("CANCEL REQUEST ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

router.delete('/requests/items/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        const item = await RequestItem.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        await recalcMasterTotal(item.requestId);

        res.json({
            success: true,
            message: "Item deleted"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.put('/requests/items/:id', verifyToken, requireAdmin, async (req, res) => {
    try {

        // const updated = await RequestItem.findByIdAndUpdate(
        //     req.params.id,
        //     req.body,
        //     { new: true }
        // );

        const allowedFields = [
            "amount",
            "currency",
            "expenseType",
            "purpose",
            "doctorName",
            "requestPeriodMonth",
            "requestPeriodYear",
            "exchangeRate",
            "amountSAR",
            "status"
        ];

        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // ✅ IMPORTANT: if amount OR currency changed → recalc SAR
        if (
            updateData.amount !== undefined ||
            updateData.currency !== undefined
        ) {
            const amount = updateData.amount ?? item.amount;
            const currency = updateData.currency ?? item.currency;

            const converted = await convertToSAR(Number(amount), currency);

            updateData.exchangeRate = converted.rate;
            updateData.amountSAR = converted.convertedAmount;
        }

        const updated = await RequestItem.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        // ✅ Recalculate master (your logic is good)

        await recalcMasterState(updated.requestId);

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

async function recalcMasterState(requestId) {

    const items = await RequestItem.find({ requestId });

    if (!items.length) return;

    // ✅ 1. Separate active vs canceled
    const activeItems = items.filter(i => i.status !== "canceled");

    // ✅ 2. Recalculate total ONLY for active items
    const total = activeItems.reduce((sum, i) => {
        return sum + (i.amountSAR || 0);
    }, 0);

    // ✅ 3. Decide master status
    let newStatus = "pending";

    if (activeItems.length === 0) {
        newStatus = "canceled";
    }

    // ✅ 4. Update master
    await MasterRequest.findByIdAndUpdate(requestId, {
        totalAmountSAR: total,
        status: newStatus
    });
}

router.get('/requests/:id/items', verifyToken, requireAdmin, async (req, res) => {
    try {

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});


// ================= CURRENCIES =================
// ================= CURRENCIES (FIXED SAFE VERSION) =================
router.get('/currencies', verifyToken, requireAdmin, async (req, res) => {
    try {

        const rates = await ExchangeRate.find({ toCurrency: "SAR" });

        const currenciesSet = new Set();

        rates.forEach(r => {
            if (r.fromCurrency) {
                currenciesSet.add(r.fromCurrency);
            }
        });

        currenciesSet.add("SAR");

        const currencies = Array.from(currenciesSet).map(c => ({
            code: c,
            name: c
        }));

        res.json({
            success: true,
            currencies
        });

    } catch (err) {
        console.error("ADMIN CURRENCIES ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Failed to load currencies"
        });
    }
});

router.post('/currencies', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { country, code, name } = req.body;

        if (!country || !code) {
            return res.status(400).json({
                success: false,
                message: "Country and Code are required"
            });
        }

        const exists = await Currency.findOne({ code: code.toUpperCase() });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Currency already exists"
            });
        }

        const created = await Currency.create({
            country: country.trim(),
            code: code.trim().toUpperCase(),
            name: name?.trim() || ""
        });

        return res.json({
            success: true,
            data: created
        });

    } catch (err) {
        console.error("CURRENCY CREATE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while creating currency"
        });
    }
});

router.put('/currencies/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const updated = await Currency.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/currencies/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        await Currency.findByIdAndDelete(req.params.id);
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});


// ================= RATES =================
router.get('/rates', verifyToken, requireAdmin, async (req, res) => {
    const data = await ExchangeRate.find();
    res.json({ success: true, data });
});

router.post('/rates', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.create(req.body));
});

router.put('/rates/:id', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExchangeRate.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

router.delete('/rates/:id', verifyToken, requireAdmin, async (req, res) => {
    await ExchangeRate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


// ================= EXPENSE TYPES =================
router.get('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    const data = await ExpenseType.find();
    res.json({ success: true, data });
});

router.post('/expense-types', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.create(req.body));
});

router.put('/expense-types/:id', verifyToken, requireAdmin, async (req, res) => {
    res.json(await ExpenseType.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});

router.delete('/expense-types/:id', verifyToken, requireAdmin, async (req, res) => {
    await ExpenseType.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


//--------------LOAD REQUESTS BY ROLE----------------------
//--------------BUDGET CONTROLE----------------------
router.get('/budgetControl', verifyToken, requireBudgetcontrole, async (req, res) => {
    try {

        const requests = await MasterRequest
            .find({ currentRole: "budget_control" })
            .sort({ createdAt: -1 });

        const data = await attachRemainingBudgetToRequests(requests);

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/budgetControl/:id/items', verifyToken, requireBudgetcontrole, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});
//--------------DIRECT MANAGER----------------------
router.get('/directMangaer', verifyToken, requireDirectmanager, async (req, res) => {
    try {

        const userAreas = req.session.user.userArea || [];

        const requests = await MasterRequest
            .find({
                currentRole: "direct_manager",
                userArea: { $in: userAreas }
            })
            .sort({ createdAt: -1 });

        const data = await attachRemainingBudgetToRequests(requests);

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/directMangaer/:id/items', verifyToken, requireDirectmanager, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

//--------------BI VP Finance----------------------
router.get('/biVpfinance', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const requests = await MasterRequest
            .find({
                currentRole: { $in: ["bi", "vp_finance"] }
            })
            .sort({ createdAt: -1 });

        const data = await attachRemainingBudgetToRequests(requests);

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get('/biVpfinance/:id/items', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const items = await RequestItem.find({
            requestId: req.params.id
        });

        res.json(items);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});


async function handleApproval({
    request,
    role,
    action, // "approve" | "reject"
    comment
}) {
    const master = request;

    const total = master.totalAmountSAR || 0;

    const isApprove = action === "approve";
    const isReject = action === "reject";
    // ================= ROLE HANDLING =================
    // ================= BUDGET CONTROLE =================
    if (role === "budget_control") {

        if (isReject) {
            master.status = "rejected";
            master.currentRole = "finished";
            master.budget_control_comment = comment || "no_comment";
            master.approved_rejected_by = role;
        }

        if (isApprove) {
            master.budget_control_comment = comment || "no_comment";
            master.status = "in_progress";
            master.currentRole = "direct_manager";
        }
    }

    // ================= Direct Manager =================
    if (role === "direct_manager") {

        if (isReject) {
            master.status = "rejected";
            master.currentRole = "finished";
            master.direct_manager_comment = comment || "no_comment";
            master.approved_rejected_by = role;
        }

        if (isApprove) {

            master.direct_manager_comment = comment || "no_comment";

            if (total <= 2000) {
                master.status = "approved";
                master.currentRole = "finished";
                master.approved_rejected_by = role;
            } else {
                master.status = "in_progress";
                master.currentRole = ["bi", "vp_finance"];
            }
        }
    }

    // ================= BI =================
    if (role === "bi") {

        if (isReject) {
            master.status = "rejected";
            master.currentRole = "finished";
            master.bi_comment = comment || "no_comment";
            master.approved_rejected_by = role;
        }

        if (isApprove) {
            master.bi_comment = comment || "no_comment";
            master.status = "approved";
            master.currentRole = "finished";
            master.approved_rejected_by = role;
        }
    }

    // ================= VP FINANCE =================
    if (role === "vp_finance") {

        if (isReject) {
            master.status = "rejected";
            master.currentRole = "finished";
            master.vp_finance_comment = comment || "no_comment";
            master.approved_rejected_by = role;
        }

        if (isApprove) {
            master.vp_finance_comment = comment || "no_comment";
            master.status = "approved";
            master.currentRole = "finished";
            master.approved_rejected_by = role;
        }
    }

    await master.save();

    // optional: sync items status
    await RequestItem.updateMany(
        { requestId: master._id },
        { status: master.status }
    );

    return master;
};

router.post('/directMangaer/:id/approve', verifyToken, requireDirectmanager, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "direct_manager",
            action: "approve",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "direct_manager",
            action: "approve",
            comment
        });

        console.log("MAIL:");
        console.log(mail);


        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/directMangaer/:id/reject', verifyToken, requireDirectmanager, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "direct_manager",
            action: "reject",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "direct_manager",
            action: "reject",
            comment
        });

        console.log("MAIL:");
        console.log(mail);


        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/bi/:id/approve', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "bi",
            action: "approve",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "bi",
            action: "approve",
            comment
        });

        console.log("MAIL:");
        console.log(mail);


        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/bi/:id/reject', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "bi",
            action: "reject",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "bi",
            action: "reject",
            comment
        });

        console.log("MAIL:");
        console.log(mail);



        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/vpFinance/:id/approve', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "vp_finance",
            action: "approve",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "vp_finance",
            action: "approve",
            comment
        });

        console.log("MAIL:");
        console.log(mail);



        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/vpFinance/:id/reject', verifyToken, requireBiorVpfinance, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "vp_finance",
            action: "reject",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "vp_finance",
            action: "reject",
            comment
        });

        console.log("MAIL:");
        console.log(mail);

        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/budgetControl/:id/approve', verifyToken, requireBudgetcontrole, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "budget_control",
            action: "approve",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "budget_control",
            action: "approve",
            comment
        });

        console.log("MAIL:");
        console.log(mail);

        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.post('/budgetControl/:id/reject', verifyToken, requireBudgetcontrole, async (req, res) => {
    try {

        const { comment } = req.body;

        const request = await MasterRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false });
        }

        const updated = await handleApproval({
            request,
            role: "budget_control",
            action: "reject",
            comment
        });

        const mail = await buildApprovalMail({
            request: updated,
            role: "budget_control",
            action: "reject",
            comment
        });

        console.log("MAIL:");
        console.log(mail);

        res.json({ success: true, data: updated, mail });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

router.get(
    '/allRequests',
    verifyToken,
    async (req, res) => {

        const roles = req.user.roles || [];

        const allowed =
            roles.includes("budget_control") ||
            roles.includes("bi") ||
            roles.includes("vp_finance");

        if (!allowed) {
            return res.status(403).json({
                success: false
            });
        }

        try {

            const requests = await MasterRequest
                .find()
                .sort({ createdAt: -1 });

            const data = await attachRemainingBudgetToRequests(requests);

            res.json({
                success: true,
                data
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false
            });
        }
    }
);

//--------------DIRECT MANAGER ALL REQUESTS----------------------
router.get(
    '/directMangaer/all',
    verifyToken,
    requireDirectmanager,
    async (req, res) => {

        try {

            const userAreas =
                req.session.user.userArea || [];

            const requests = await MasterRequest
                .find({
                    userArea: { $in: userAreas }
                })
                .sort({ createdAt: -1 });

            const data = await attachRemainingBudgetToRequests(requests);

            res.json({
                success: true,
                data
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false
            });
        }
    }
);




module.exports = router;