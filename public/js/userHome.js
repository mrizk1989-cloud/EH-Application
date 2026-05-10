import FileHandler from "./utils/fileHandler.js";
import ExportModule from "./utils/exportModule.js";
import EhPolicyModule from "./utils/ehPolicyModule.js";

let userRole;
let allRequests = [];
let allRequestItems = [];

function setTheme(mode) {

    document.documentElement.setAttribute("data-theme", mode);

    localStorage.setItem("theme", mode);

    const themeBtn = document.getElementById("themeToggleBtn");

    if (themeBtn) {
        themeBtn.textContent =
            mode === "dark"
                ? "Light"
                : "Dark";
    }
}

// ================= LOAD SAVED THEME =================
const savedTheme = localStorage.getItem("theme") || "light";

setTheme(savedTheme);

function showView(view) {

    const requestsView = document.getElementById("requestsView");
    const dashboard = document.getElementById("dashboardContainer");

    if (view === "requests") {
        requestsView.classList.remove("hidden");
        dashboard.classList.add("hidden");
    }

    if (view === "dashboard") {
        requestsView.classList.add("hidden");
        dashboard.classList.remove("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {

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

    // ================= THEME =================
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

    // ================= PASSWORD EYE =================
    document.addEventListener("click", (e) => {

        const target = e.target;

        if (
            !target.classList.contains("toggle-eye-current") &&
            !target.classList.contains("toggle-eye-new")
        ) {
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

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const res = await fetch("/api/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await res.json();

        alert(data.message);

        if (data.success) {
            modal.classList.add("hidden");
        }
    });

    // ================= LOAD USER =================
    async function loadUser() {

        try {

            const res = await fetch("/api/me", {
                credentials: "include"
            });

            const data = await res.json();

            if (data.success) {

                userRole = (data.user.roles || []).join(", ");

                userNameEl.innerText = data.user.userName;

                ExportModule.setRole(
                    data.user.roles?.[0] || "user"
                );

                if (data.user.mustChangePassword) {

                    modal.classList.remove("hidden");

                    alert(
                        "You must change your password before continuing"
                    );
                }
            }

        } catch (err) {
            console.error(err);
        }
    }

    // ================= LOAD ALL REQUEST ITEMS =================
    async function loadAllRequestItems(requests) {

        try {

            let endpointPrefix = "/api/request/my";

            if (userRole === "budget_control") {
                endpointPrefix = "/admin/budgetControl";
            }
            else if (userRole === "direct_manager") {
                endpointPrefix = "/admin/directMangaer";
            }
            else if (
                userRole === "bi" ||
                userRole === "vp_finance"
            ) {
                endpointPrefix = "/admin/biVpfinance";
            }

            const itemPromises = requests.map(r =>
                fetch(`${endpointPrefix}/${r._id}/items`, {
                    credentials: "include"
                }).then(res => res.json())
            );

            const itemsArrays =
                await Promise.all(itemPromises);

            allRequestItems = itemsArrays.flat();

        } catch (err) {

            console.error(
                "LOAD ITEMS ERROR:",
                err
            );
        }
    }

    // ================= POPULATE FILTERS =================
    function populateFilters() {

        const yearSelect =
            document.getElementById("filterYear");

        const statusSelect =
            document.getElementById("filterStatus");

        const roleSelect =
            document.getElementById("filterRole");

        if (
            !yearSelect ||
            !statusSelect ||
            !roleSelect
        ) {
            return;
        }

        // YEARS
        const years = [
            ...new Set(
                allRequestItems.map(
                    i => i.requestPeriodYear
                )
            )
        ]
            .filter(Boolean)
            .sort((a, b) => b - a);

        yearSelect.innerHTML =
            `<option value="">All Years</option>` +
            years.map(y =>
                `<option value="${y}">${y}</option>`
            ).join("");

        // STATUS
        const statuses = [
            ...new Set(
                allRequests.map(r => r.status)
            )
        ].filter(Boolean);

        statusSelect.innerHTML =
            `<option value="">All Statuses</option>` +
            statuses.map(s =>
                `<option value="${s}">${s}</option>`
            ).join("");

        // ROLES
        const roles = [
            ...new Set(
                allRequests.map(r => r.currentRole)
            )
        ].filter(Boolean);

        roleSelect.innerHTML =
            `<option value="">All Roles</option>` +
            roles.map(r =>
                `<option value="${r}">${r}</option>`
            ).join("");
    }

    // ================= RENDER REQUESTS =================
    function renderRequests(data) {

        if (!Array.isArray(data)) {

            wrapper.innerHTML =
                "<p>Error loading</p>";

            return;
        }

        const isAdminRole =
            userRole === "budget_control" ||
            userRole === "direct_manager" ||
            userRole === "bi" ||
            userRole === "vp_finance";

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
        `;

        if (!isAdminRole) {
            html += `<th>Current Role</th>`;
        }

        html += `
                        <th>Attachments</th>
                        <th>Details</th>
        `;

        if (isAdminRole) {
            html += `<th>Approval</th>`;
        }

        html += `
                    </tr>
                </thead>

                <tbody>
        `;

        data.forEach(r => {

            html += `
                <tr data-id="${r._id}">
                    <td>${r.requestNo || ""}</td>
                    <td>${r.totalAmountSAR || 0}</td>
                    <td>${r.status || ""}</td>
                    <td>${r.budget_control_comment || ""}</td>
                    <td>${r.direct_manager_comment || ""}</td>
                    <td>${r.bi_comment || ""}</td>
                    <td>${r.vp_finance_comment || ""}</td>
            `;

            if (!isAdminRole) {
                html += `
                    <td>${r.currentRole || ""}</td>
                `;
            }

            html += `
                    <td>
                        ${((r.attachments || [])
                    .map(file =>
                        FileHandler.render(file)
                    )
                    .join(""))}
                    </td>

                    <td>
                        <button class="view-request">
                            View
                        </button>
                    </td>
            `;

            if (isAdminRole) {

                html += `
                    <td>
                        <button class="approve-request">
                            Approve
                        </button>

                        <button class="reject-request">
                            Reject
                        </button>
                    </td>
                `;
            }

            html += `</tr>`;
        });

        html += `
                </tbody>
            </table>
        `;

        wrapper.innerHTML = html;
    }

    // ================= APPLY FILTERS =================
    function applyFilters() {

        const year =
            document.getElementById("filterYear")?.value || "";

        const status =
            document.getElementById("filterStatus")?.value || "";

        const role =
            document.getElementById("filterRole")?.value || "";

        let filtered = [...allRequests];

        // STATUS
        if (status) {

            filtered = filtered.filter(r =>
                r.status === status
            );
        }

        // ROLE
        if (role) {

            filtered = filtered.filter(r =>
                r.currentRole === role
            );
        }

        // YEAR
        if (year) {

            const matchingRequestIds = [
                ...new Set(
                    allRequestItems
                        .filter(i =>
                            String(i.requestPeriodYear) === String(year)
                        )
                        .map(i =>
                            String(i.requestId)
                        )
                )
            ];

            filtered = filtered.filter(r =>
                matchingRequestIds.includes(
                    String(r._id)
                )
            );
        }

        renderRequests(filtered);
    }

    // ================= SEARCH BUTTON =================
    const searchBtn =
        document.getElementById("searchRequestsBtn");

    if (searchBtn) {

        searchBtn.addEventListener("click", () => {
            applyFilters();
        });
    }

    // ================= LOAD REQUESTS =================
    async function loadRequestsByRole() {

        try {

            let endpoint =
                "/api/request/my-detailed";

            if (userRole === "budget_control") {
                endpoint = "/admin/budgetControl";
            }
            else if (userRole === "direct_manager") {
                endpoint = "/admin/directMangaer";
            }
            else if (
                userRole === "bi" ||
                userRole === "vp_finance"
            ) {
                endpoint = "/admin/biVpfinance";
            }

            const res = await fetch(endpoint, {
                credentials: "include"
            });

            const json = await res.json();

            const data = json.data || [];

            allRequests = data;

            await loadAllRequestItems(data);

            populateFilters();

            renderRequests(data);

        } catch (err) {

            console.error(err);

            wrapper.innerHTML =
                "<p>Error loading data</p>";
        }
    }

    // ================= VIEW REQUEST =================
    document.addEventListener("click", async (e) => {

        if (
            !e.target.classList.contains(
                "view-request"
            )
        ) {
            return;
        }

        const parentRow =
            e.target.closest("tr");

        const requestId =
            parentRow.dataset.id;

        // TOGGLE CLOSE
        if (
            parentRow.nextElementSibling?.classList.contains(
                "sub-table-row"
            )
        ) {
            parentRow.nextElementSibling.remove();
            return;
        }

        // CLOSE OTHERS
        document
            .querySelectorAll(".sub-table-row")
            .forEach(el => el.remove());

        let endpoint =
            `/api/request/my/${requestId}/items`;

        if (userRole === "budget_control") {
            endpoint =
                `/admin/budgetControl/${requestId}/items`;
        }
        else if (
            userRole === "direct_manager"
        ) {
            endpoint =
                `/admin/directMangaer/${requestId}/items`;
        }
        else if (
            userRole === "bi" ||
            userRole === "vp_finance"
        ) {
            endpoint =
                `/admin/biVpfinance/${requestId}/items`;
        }

        const res = await fetch(endpoint, {
            credentials: "include"
        });

        const items = await res.json();

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return;
        }

        const subRow =
            document.createElement("tr");

        subRow.classList.add(
            "sub-table-row"
        );

        subRow.innerHTML = `
            <td colspan="12">

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

        parentRow.insertAdjacentElement(
            "afterend",
            subRow
        );
    });

    // ================= APPROVALS =================
    document.addEventListener("click", async (e) => {

        const id =
            e.target.closest("tr")?.dataset?.id;

        if (!id) return;

        let endpoint = null;

        // BUDGET CONTROL
        if (
            e.target.classList.contains(
                "approve-request"
            ) &&
            userRole === "budget_control"
        ) {
            endpoint =
                `/admin/budgetControl/${id}/approve`;
        }

        if (
            e.target.classList.contains(
                "reject-request"
            ) &&
            userRole === "budget_control"
        ) {
            endpoint =
                `/admin/budgetControl/${id}/reject`;
        }

        // DIRECT MANAGER
        if (
            e.target.classList.contains(
                "approve-request"
            ) &&
            userRole === "direct_manager"
        ) {
            endpoint =
                `/admin/directMangaer/${id}/approve`;
        }

        if (
            e.target.classList.contains(
                "reject-request"
            ) &&
            userRole === "direct_manager"
        ) {
            endpoint =
                `/admin/directMangaer/${id}/reject`;
        }

        // BI
        if (
            e.target.classList.contains(
                "approve-request"
            ) &&
            userRole === "bi"
        ) {
            endpoint =
                `/admin/bi/${id}/approve`;
        }

        if (
            e.target.classList.contains(
                "reject-request"
            ) &&
            userRole === "bi"
        ) {
            endpoint =
                `/admin/bi/${id}/reject`;
        }

        // VP FINANCE
        if (
            e.target.classList.contains(
                "approve-request"
            ) &&
            userRole === "vp_finance"
        ) {
            endpoint =
                `/admin/vpFinance/${id}/approve`;
        }

        if (
            e.target.classList.contains(
                "reject-request"
            ) &&
            userRole === "vp_finance"
        ) {
            endpoint =
                `/admin/vpFinance/${id}/reject`;
        }

        if (!endpoint) return;

        const comment =
            prompt("Add comment (optional):") || "";

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                comment
            })
        });

        const data = await res.json();

        if (data.success) {

            alert("Updated successfully");

            init();

        } else {

            alert("Failed");
        }
    });

    // ================= EXPORT =================
    const exportBtn =
        document.querySelector(
            '[data-section="export"]'
        );

    const exportContainer =
        document.getElementById(
            "exportContainer"
        );

    if (exportBtn && exportContainer) {

        exportBtn.addEventListener("click", () => {

            const isHidden =
                exportContainer.classList.contains(
                    "hidden"
                );

            if (isHidden) {

                exportContainer.classList.remove(
                    "hidden"
                );

                ExportModule.render(
                    "exportContainer"
                );

            } else {

                exportContainer.classList.add(
                    "hidden"
                );
            }
        });
    }

    // ================= SAFE GLOBAL EVENTS =================
    document.addEventListener("click", (e) => {

        if (
            e.target?.id === "closeExportBtn" ||
            e.target?.closest("#closeExportBtn")
        ) {
            exportContainer?.classList.add(
                "hidden"
            );
        }
    });

    ExportModule.render("exportContainer");

    // ================= NAVIGATION =================
    newRequestBtn.addEventListener("click", () => {
        window.location.href =
            "/request-form";
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

    // ================= DASHBOARD =================

    const dashboardBtn = document.querySelector('[data-tab="dashboard"]');
    const requestsBtn = document.querySelector('[data-tab="requests"]');

    dashboardBtn.addEventListener("click", async () => {

        showView("dashboard");

        dashboardContainer.innerHTML = ""; // optional clean

        // FULL ACCESS
        if (
            userRole === "budget_control" ||
            userRole === "bi" ||
            userRole === "vp_finance"
        ) {
            EhPolicyModule.render("dashboardContainer");
            return;
        }

        // RESTRICTED
        if (
            userRole === "direct_manager" ||
            userRole === "sales_manager"
        ) {
            renderRestrictedDashboard();
        }
    });

    requestsBtn.addEventListener("click", async () => {

        showView("requests");

        // optional: refresh or re-render
        renderRequests(allRequests);
    });

    // ================= RESTRICTED DASHBOARD =================

    async function renderRestrictedDashboard() {

        dashboardContainer.innerHTML = `

            <div class="ehp-wrapper">

                <div class="ehp-section active">

                    <h3>Dashboard</h3>

                    <div class="ehp-form">
                        <input
                            id="restrictedDashboardYear"
                            type="number"
                            placeholder="Year"
                        >

                        <button id="loadRestrictedDashboardBtn">
                            Load
                        </button>
                    </div>

                    <div id="restrictedDashboardResult"></div>

                </div>

            </div>
        `;

        const loadBtn =
            document.getElementById(
                "loadRestrictedDashboardBtn"
            );

        if (!loadBtn) return;

        loadBtn.addEventListener("click", async () => {

            const year =
                document.getElementById(
                    "restrictedDashboardYear"
                ).value;

            let url =
                "/api/eh/dashboard/restricted";

            if (year) {
                url += `?year=${year}`;
            }

            const res = await fetch(url, {
                credentials: "include"
            });

            const json = await res.json();

            const data = json.data || {};

            renderRestrictedDashboardTable(data);
        });

        // AUTO LOAD
        loadBtn.click();
    }

    // ================= RENDER RESTRICTED TABLE =================

    function renderRestrictedDashboardTable(data) {

        const container =
            document.getElementById(
                "restrictedDashboardResult"
            );

        if (!container) return;

        let html = "";

        Object.keys(data).forEach(yearKey => {

            html += `

                <h2 style="margin-top:20px;">
                    Year ${yearKey}
                </h2>

                <table class="sap-table">

                    <thead>
                        <tr>
                            <th>Area</th>
                            <th>Budget</th>
                            <th>Performance %</th>
                            <th>Available Budget</th>
                            <th>Expenses</th>
                            <th>Depreciation</th>
                            <th>Remaining</th>
                            <th>Progress</th>
                        </tr>
                    </thead>

                    <tbody>
            `;

            data[yearKey].forEach(row => {

                html += `

                    <tr>
                        <td>${row.area}</td>
                        <td>${row.budget}</td>
                        <td>${row.performancePercent}%</td>
                        <td>${row.availableBudget.toFixed(2)}</td>
                        <td>${row.expenses}</td>
                        <td>${row.depreciation}</td>
                        <td>${row.remaining}</td>
                        <td>${row.progress.toFixed(2)}%</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;
        });

        container.innerHTML = html;
    }

    // ================= INIT =================
    async function init() {

        await loadUser();

        await loadRequestsByRole();
    }

    init();
});