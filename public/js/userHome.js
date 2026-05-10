import FileHandler from "./utils/fileHandler.js";

let userRole

function setTheme(mode) {

    document.documentElement.setAttribute("data-theme", mode);

    localStorage.setItem("theme", mode);

    // update button text
    const themeBtn = document.getElementById("themeToggleBtn");

    if (themeBtn) {
        themeBtn.textContent = mode === "dark"
            ? "Light"
            : "Dark";
    }
}

// ================= LOAD SAVED THEME =================
const savedTheme = localStorage.getItem("theme") || "light";

setTheme(savedTheme);

document.addEventListener("DOMContentLoaded", () => {

    // 🔥 initialize once
    FileHandler.init();

    const logoutBtn = document.getElementById("logoutBtn");
    const newRequestBtn = document.getElementById("newRequestBtn");
    const userNameEl = document.getElementById("userName");
    const wrapper = document.getElementById("requestsWrapper");

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const modal = document.getElementById("passwordModal");
    const savePasswordBtn = document.getElementById("savePasswordBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    const themeBtn = document.getElementById("themeToggleBtn");

    themeBtn.addEventListener("click", () => {

        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        setTheme(newTheme);
    });


    // ================= OPEN MODAL =================
    changePasswordBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    // ================= CLOSE MODAL =================
    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
    // ================= EYE MODAL =================
    document.addEventListener("click", (e) => {

        const target = e.target;

        // accept both toggles
        if (!target.classList.contains("toggle-eye-current") &&
            !target.classList.contains("toggle-eye-new")) {
            return;
        }

        const inputId = target.dataset.target;
        const input = document.getElementById(inputId);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            target.textContent = "🙈";
        } else {
            input.type = "password";
            target.textContent = "👁";
        }
    });

    // ================= SAVE PASSWORD =================
    savePasswordBtn.addEventListener("click", async () => {

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;

        const res = await fetch("/api/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        alert(data.message);

        if (data.success) {
            modal.classList.add("hidden");
        }
    });

    // ================= LOAD USER INFO =================
    async function loadUser() {
        try {
            const res = await fetch("/api/me", { credentials: "include" });
            const data = await res.json();

            // console.log((data.user.roles || []).join(", "))

            userRole = (data.user.roles || []).join(", ")


            if (data.success) {
                userNameEl.innerText = data.user.userName;

                // 🔥 FORCE PASSWORD CHANGE
                if (data.user.mustChangePassword) {
                    modal.classList.remove("hidden");
                    alert("You must change your password before continuing");
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    // ================= LOAD REQUESTS =================

    async function loadRequestsBudgetcontrol() {
        try {
            const res = await fetch("/admin/budgetControl", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data;



            if (!Array.isArray(data)) {
                wrapper.innerHTML = "<p>Error loading</p>";
                return;
            }

            let html = `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Request No</th>
                                        <th>Total (SAR)</th>
                                        <th>Status</th>
                                        <th>Budget Controle Comment</th>
                                        <th>Direct Manager Comment</th>
                                        <th>BI Comment</th>
                                        <th>VP Finance Comment</th>
                                        <th>Attachments</th>
                                        <th>Details</th>
                                        <th>Approval</th>
                                    </tr>
                                </thead>
                                <tbody>
                            `;

            data.forEach(r => {
                html += `
                            <tr data-id="${r._id}">
                                <td>${r.requestNo}</td>
                                <td>${r.totalAmountSAR}</td>
                                <td>${r.status}</td>
                                <td>${r.budget_control_comment}</td>
                                <td>${r.direct_manager_comment}</td>
                                <td>${r.bi_comment}</td>
                                <td>${r.vp_finance_comment}</td>
                                <td> ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}</td>
                                <td><button class="view-request">View</button></td>
                                <td>
                                    <button class="approve-request">Approve</button>
                                    <button class="reject-request">Reject</button>
                                </td>
                            </tr>
                            `;
            });

            html += `</tbody></table>`;
            wrapper.innerHTML = html;

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }

    async function loadRequestsBiVpfinance() {
        try {
            const res = await fetch("/admin/biVpfinance", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data;



            if (!Array.isArray(data)) {
                wrapper.innerHTML = "<p>Error loading</p>";
                return;
            }

            let html = `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Request No</th>
                                        <th>Total (SAR)</th>
                                        <th>Status</th>
                                        <th>Budget Controle Comment</th>
                                        <th>Direct Manager Comment</th>
                                        <th>BI Comment</th>
                                        <th>VP Finance Comment</th>
                                        <th>Attachments</th>
                                        <th>Details</th>
                                        <th>Approval</th>
                                    </tr>
                                </thead>
                                <tbody>
                            `;

            data.forEach(r => {
                html += `
                            <tr data-id="${r._id}">
                                <td>${r.requestNo}</td>
                                <td>${r.totalAmountSAR}</td>
                                <td>${r.status}</td>
                                <td>${r.budget_control_comment}</td>
                                <td>${r.direct_manager_comment}</td>
                                <td>${r.bi_comment}</td>
                                <td>${r.vp_finance_comment}</td>
                                <td> ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}</td>
                                <td><button class="view-request">View</button></td>
                                <td>
                                    <button class="approve-request">Approve</button>
                                    <button class="reject-request">Reject</button>
                                </td>
                            </tr>
                            `;
            });

            html += `</tbody></table>`;
            wrapper.innerHTML = html;

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }

    async function loadRequestsDirectmanager() {
        try {
            const res = await fetch("/admin/directMangaer", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data;



            if (!Array.isArray(data)) {
                wrapper.innerHTML = "<p>Error loading</p>";
                return;
            }

            let html = `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Request No</th>
                                        <th>Total (SAR)</th>
                                        <th>Status</th>
                                        <th>Budget Controle Comment</th>
                                        <th>Direct Manager Comment</th>
                                        <th>BI Comment</th>
                                        <th>VP Finance Comment</th>
                                        <th>Attachments</th>
                                        <th>Details</th>
                                        <th>Approval</th>
                                    </tr>
                                </thead>
                                <tbody>
                            `;

            data.forEach(r => {
                html += `
                            <tr data-id="${r._id}">
                                <td>${r.requestNo}</td>
                                <td>${r.totalAmountSAR}</td>
                                <td>${r.status}</td>
                                <td>${r.budget_control_comment}</td>
                                <td>${r.direct_manager_comment}</td>
                                <td>${r.bi_comment}</td>
                                <td>${r.vp_finance_comment}</td>
                                <td> ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}</td>
                                <td><button class="view-request">View</button></td>
                                <td>
                                    <button class="approve-request">Approve</button>
                                    <button class="reject-request">Reject</button>
                                </td>
                            </tr>
                            `;
            });

            html += `</tbody></table>`;
            wrapper.innerHTML = html;

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }


    async function loadRequests() {
        try {
            const res = await fetch("/api/request/my-detailed", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data;



            if (!Array.isArray(data)) {
                wrapper.innerHTML = "<p>Error loading</p>";
                return;
            }

            let html = `
        <table>
            <thead>
                <tr>
                    <th>Request No</th>
                    <th>Total (SAR)</th>
                    <th>Status</th>
                    <th>Budget Controle Comment</th>
                    <th>Direct Manager Comment</th>
                    <th>BI Comment</th>
                    <th>VP Finance Comment</th>
                    <th>Current Role</th>
                    <th>Attachments</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
        `;

            data.forEach(r => {
                html += `
            <tr data-id="${r._id}">
                <td>${r.requestNo}</td>
                <td>${r.totalAmountSAR}</td>
                <td>${r.status}</td>
                 <td>${r.budget_control_comment}</td>
                <td>${r.direct_manager_comment}</td>
                <td>${r.bi_comment}</td>
                <td>${r.vp_finance_comment}</td>
                <td>${r.currentRole}</td>
                <td> ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}</td>
                <td><button class="view-request">View</button></td>
            </tr>
            `;
            });

            html += `</tbody></table>`;
            wrapper.innerHTML = html;

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }

    document.addEventListener("click", async (e) => {

        if (!e.target.classList.contains("view-request")) return;

        const parentRow = e.target.closest("tr");
        const requestId = parentRow.dataset.id;

        // toggle close
        if (parentRow.nextElementSibling?.classList.contains("sub-table-row")) {
            parentRow.nextElementSibling.remove();
            return;
        }

        // close others
        document.querySelectorAll(".sub-table-row").forEach(el => el.remove());

        let res;
        ////////////////////////////////////////////////////////////
        if (userRole === "budget_control") {
            res = await fetch(`/admin/budgetControl/${requestId}/items`, {
                credentials: "include"
            });
        } else if (userRole === "direct_manager") {
            res = await fetch(`/admin/directMangaer/${requestId}/items`, {
                credentials: "include"
            });
        } else if (userRole === "bi" || userRole === "vp_finance") {
            res = await fetch(`/admin/biVpfinance/${requestId}/items`, {
                credentials: "include"
            });
        } else {
            res = await fetch(`/api/request/my/${requestId}/items`, {
                credentials: "include"
            });
        }
        /////////////////////////////////////////////////////////////
        const items = await res.json(); // ✅ correct

        if (!Array.isArray(items) || items.length === 0) return;

        const subRow = document.createElement("tr");
        subRow.classList.add("sub-table-row");

        subRow.innerHTML = `
        <td colspan="4">
            <table class="sub-table">
                <thead>
                    <tr>
                        <th>Sub No</th>
                        <th>Customer ID</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Expense</th>
                        <th>Purpose</th>
                        <th>Doctor</th>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Rate</th>
                        <th>SAR</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.subRequestNo}</td>
                            <td>${item.customerId}</td>
                            <td>${item.amount}</td>
                            <td>${item.currency}</td>
                            <td>${item.expenseType}</td>
                            <td>${item.purpose}</td>
                            <td>${item.doctorName}</td>
                            <td>${item.requestPeriodMonth}</td>
                            <td>${item.requestPeriodYear}</td>
                            <td>${item.exchangeRate}</td>
                            <td>${item.amountSAR}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </td>
    `;

        parentRow.insertAdjacentElement("afterend", subRow);
    });

    document.addEventListener("click", async (e) => {

        const id = e.target.closest("tr")?.dataset?.id;
        if (!id) return;

        let endpoint = null;

        // ================= BUDGET CONTROL =================
        if (e.target.classList.contains("approve-request") && userRole === "budget_control") {
            endpoint = `/admin/budgetControl/${id}/approve`;
        }

        if (e.target.classList.contains("reject-request") && userRole === "budget_control") {
            endpoint = `/admin/budgetControl/${id}/reject`;
        }

        // ================= DIRECT MANAGER =================
        if (e.target.classList.contains("approve-request") && userRole === "direct_manager") {
            endpoint = `/admin/directMangaer/${id}/approve`;
        }

        if (e.target.classList.contains("reject-request") && userRole === "direct_manager") {
            endpoint = `/admin/directMangaer/${id}/reject`;
        }

        // ================= BI =================
        if (e.target.classList.contains("approve-request") && userRole === "bi") {
            endpoint = `/admin/bi/${id}/approve`;
        }

        if (e.target.classList.contains("reject-request") && userRole === "bi") {
            endpoint = `/admin/bi/${id}/reject`;
        }

        // ================= VP FINANCE =================
        if (e.target.classList.contains("approve-request") && userRole === "vp_finance") {
            endpoint = `/admin/vpFinance/${id}/approve`;
        }

        if (e.target.classList.contains("reject-request") && userRole === "vp_finance") {
            endpoint = `/admin/vpFinance/${id}/reject`;
        }

        if (!endpoint) return;

        const comment = prompt("Add comment (optional):") || "";

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ comment })
        });

        const data = await res.json();

        if (data.success) {
            alert("Updated successfully");
            init(); // reload table
        } else {
            alert("Failed");
        }
    });

    // ================= NAVIGATION =================
    newRequestBtn.addEventListener("click", () => {
        window.location.href = "/request-form";
    });

    // ================= LOGOUT =================
    logoutBtn.addEventListener("click", async () => {

        if (!confirm("Logout?")) return;

        await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        window.location.href = "/";
    });

    // ================= INIT =================
    async function init() {
        await loadUser();

        if (userRole === "budget_control") {
            loadRequestsBudgetcontrol();
        } else if (userRole === "direct_manager") {
            loadRequestsDirectmanager();
        } else if (userRole === "bi" || userRole === "vp_finance") {
            loadRequestsBiVpfinance();
        } else {
            loadRequests();
        }
    }

    init();

});

