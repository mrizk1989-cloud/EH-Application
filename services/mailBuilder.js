const User = require("../models/User");

// ================= GET USERS BY ROLE =================
async function getUsersByRole(role, areas = []) {

    console.log("\n=== getUsersByRole START ===");
    console.log("Role:", role);
    console.log("Incoming Areas:", areas);

    const filter = {
        roles: { $in: [role] },
        status: "active"
    };

    // ================= DIRECT MANAGER AREA FILTER =================
    if (
        role === "direct_manager" &&
        Array.isArray(areas) &&
        areas.length > 0
    ) {

        filter.area_section = {
            $in: areas
        };
    }

    console.log("Final Filter:");
    console.log(JSON.stringify(filter, null, 2));

    const users = await User.find(filter);

    console.log(
        "Matched Users:",
        users.map(u => ({
            user: u.userName,
            email: u.user_email,
            areas: u.area_section
        }))
    );

    console.log("=== getUsersByRole END ===\n");

    return users
        .map(u => u.user_email)
        .filter(Boolean);
}

// ================= MAIN MAIL BUILDER =================
async function buildApprovalMail({
    request,
    action,
    role,
    comment
}) {

    console.log("\n==============================");
    console.log("BUILD MAIL START");
    console.log("ROLE:", role);
    console.log("ACTION:", action);
    console.log("==============================\n");

    let to = [];
    let cc = [];

    let subject = "";
    let body = "";

    // ================= REQUESTER =================
    const requester =
        await User.findById(request.userId);

    const requesterEmail =
        requester?.user_email || "";

    // ================= BUDGET CONTROL EMAILS =================
    const budgetControlEmails =
        await getUsersByRole("budget_control");

    // =====================================================
    // BUDGET CONTROL APPROVE
    // =====================================================
    if (
        role === "budget_control" &&
        action === "approve"
    ) {

        const areas =
            Array.isArray(request.userArea)
                ? request.userArea
                : request.userArea
                    ? [request.userArea]
                    : [];

        console.log("Normalized Areas:", areas);

        // ================= DIRECT MANAGERS =================
        to = await getUsersByRole(
            "direct_manager",
            areas
        );

        // ================= CC =================
        cc = [
            requesterEmail,
            ...budgetControlEmails
        ];

        subject =
            `Request ${request.requestNo} Pending Direct Manager Approval`;

        body = `
Request No: ${request.requestNo}

Requester: ${request.userName}

Total Amount: ${request.totalAmountSAR} SAR

Status:
Approved by Budget Control

Next Step:
Direct Manager Approval Required

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // BUDGET CONTROL REJECT
    // =====================================================
    else if (
        role === "budget_control" &&
        action === "reject"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Rejected by Budget Control`;

        body = `
Your request has been rejected.

Request No:
${request.requestNo}

Rejected By:
Budget Control

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // DIRECT MANAGER APPROVE
    // =====================================================
    else if (
        role === "direct_manager" &&
        action === "approve"
    ) {

        // ================= <= 2000 =================
        if (request.totalAmountSAR <= 2000) {

            to = [requesterEmail];

            cc = budgetControlEmails;

            subject =
                `Request ${request.requestNo} Fully Approved`;

            body = `
Your request has been fully approved.

Request No:
${request.requestNo}

Approved By:
Direct Manager

Total Amount:
${request.totalAmountSAR} SAR

Comment:
${comment || "N/A"}

This is an automated notification.
            `.trim();
        }

        // ================= > 2000 =================
        else {

            const biUsers =
                await getUsersByRole("bi");

            const vpFinanceUsers =
                await getUsersByRole("vp_finance");

            to = [
                ...biUsers,
                ...vpFinanceUsers
            ];

            cc = [
                requesterEmail,
                ...budgetControlEmails
            ];

            subject =
                `Request ${request.requestNo} Pending BI / VP Finance Approval`;

            body = `
Request No:
${request.requestNo}

Requester:
${request.userName}

Total Amount:
${request.totalAmountSAR} SAR

Status:
Approved by Direct Manager

Next Step:
BI / VP Finance Approval Required

Comment:
${comment || "N/A"}

This is an automated notification.
            `.trim();
        }
    }

    // =====================================================
    // DIRECT MANAGER REJECT
    // =====================================================
    else if (
        role === "direct_manager" &&
        action === "reject"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Rejected by Direct Manager`;

        body = `
Your request has been rejected.

Request No:
${request.requestNo}

Rejected By:
Direct Manager

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // BI APPROVE
    // =====================================================
    else if (
        role === "bi" &&
        action === "approve"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Approved by BI`;

        body = `
Your request has been approved.

Request No:
${request.requestNo}

Approved By:
BI

Total Amount:
${request.totalAmountSAR} SAR

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // BI REJECT
    // =====================================================
    else if (
        role === "bi" &&
        action === "reject"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Rejected by BI`;

        body = `
Your request has been rejected.

Request No:
${request.requestNo}

Rejected By:
BI

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // VP FINANCE APPROVE
    // =====================================================
    else if (
        role === "vp_finance" &&
        action === "approve"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Approved by VP Finance`;

        body = `
Your request has been approved.

Request No:
${request.requestNo}

Approved By:
VP Finance

Total Amount:
${request.totalAmountSAR} SAR

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    // =====================================================
    // VP FINANCE REJECT
    // =====================================================
    else if (
        role === "vp_finance" &&
        action === "reject"
    ) {

        to = [requesterEmail];

        cc = budgetControlEmails;

        subject =
            `Request ${request.requestNo} Rejected by VP Finance`;

        body = `
Your request has been rejected.

Request No:
${request.requestNo}

Rejected By:
VP Finance

Comment:
${comment || "N/A"}

This is an automated notification.
        `.trim();
    }

    const mail = {
        to,
        cc,
        subject,
        body
    };

    console.log("\n==============================");
    console.log("FINAL MAIL OBJECT:");
    console.log(JSON.stringify(mail, null, 2));
    console.log("==============================\n");

    return mail;
}

module.exports = {
    buildApprovalMail
};