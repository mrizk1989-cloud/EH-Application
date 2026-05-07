let requestsCache = [];
let currenciesCache = [];
let expenseTypesCache = [];

import FileHandler from "./utils/fileHandler.js";
import ExportModule from "./utils/exportModule.js";


const savedTheme = localStorage.getItem("theme") || "light";

document.documentElement.setAttribute("data-theme", savedTheme);


document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");
    const wrapper = document.getElementById("settingsTableWrapper");
    const title = document.getElementById("settingsTitle");

    // 🔥 initialize once
    FileHandler.init();

    

    document.getElementById("darkModeBtn").addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    });

    document.getElementById("lightModeBtn").addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    });


    // ================= NAV =================
    document.querySelectorAll(".nav-links button[data-section]")
        .forEach(btn => {
            btn.addEventListener("click", () => {

                const section = btn.dataset.section;

                document.querySelectorAll(".section")
                    .forEach(s => s.classList.remove("active"));

                document.getElementById(section + "Section").classList.add("active");

                if (section === "users") loadUsers();
                if (section === "requests") loadRequests();
                if (section === "export") {
                    ExportModule.render("exportContainer");
                }
            });
        });

    // ================= DROPDOWN =================
    const dropdown = document.getElementById("settingsDropdown");
    const dropdownBtn = document.getElementById("dropdownBtn");

    dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });

    document.addEventListener("click", (e) => {

        const item = e.target.closest(".dropdown-item");
        if (!item) return;

        const value = item.dataset.value;

        document.querySelectorAll(".section")
            .forEach(s => s.classList.remove("active"));

        document.getElementById("settingsSection").classList.add("active");

        if (value === "rates") {
            title.innerText = "Exchange Rates";
            loadRates();
        }

        if (value === "currencies") {
            title.innerText = "Currencies";
            loadCurrencies();
        }

        if (value === "expenseTypes") {
            title.innerText = "Expense Types";
            loadExpenseTypes();
        }
    });

    // =====================================================
    // USERS
    // =====================================================
    async function loadUsers() {
        const res = await fetch("/admin/users", { credentials: "include" });
        const data = await res.json();


        const body = document.getElementById("usersTableBody");
        body.innerHTML = ``;

        data.forEach(u => {
            body.innerHTML += `
                    <tr data-id="${u._id}">
                        <td class="name">${u.user_name}</td>
                        <td class="email">${u.user_email}</td>
                        <td class="type">${u.user_type}</td>
                        <td class="roles">${(u.roles || []).join(", ")}</td>
                        <td class="type">${u.country}</td>
                        <td class="type">${(u.area_section || []).join(", ")}</td>
                        <td class="status">${u.status}</td>
                        <td class="password"></td>
                        <td class="action-cell">
                            <button class="edit-user">Edit</button>
                            <button class="delete-user">Delete</button>
                        </td>
                    </tr>
                    `;
        });
    };

    async function loadRequests() {
        try {
            const res = await fetch("/admin/requests", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data; // ✅ FIX

            if (!Array.isArray(data)) {
                console.error("Invalid requests response:", json);
                return;
            }

            const body = document.getElementById("requestsTableBody");
            body.innerHTML = "";

            data.forEach(r => {
                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                    <td class="requestNo">${r.requestNo || ""}</td>
                    <td class="userName">${r.userName || ""}</td>
                    <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                    <td class="status">${r.status || "pending"}</td>
                    <td class="userName">${r.currentRole || ""}</td>
                    <td class="attachments">
                        ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}
                    </td>
                    <td class="action-cell">
                        <button class="view-request">View</button>
                        <button class="delete-request">Cancel Request</button>
                    </td>
            `;

                body.appendChild(tr);
            });


        } catch (err) {
            console.error("loadRequests error:", err);
        }
    }

    // =====================================================
    // SETTINGS LOADERS
    // =====================================================
    async function loadCurrencies() {

        const res = await fetch("/admin/currencies", { credentials: "include" });
        const data = await res.json();

        let html = `
        <table>
        <thead>
        <tr>
            <th>Country</th>
            <th>Code</th>
            <th>Name</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>

        <tr>
            <td><input id="curCountry"></td>
            <td><input id="curCode"></td>
            <td><input id="curName"></td>
            <td class="action-cell"><button data-action="create-currency">Create</button></td>
        </tr>
        `;

        data.forEach(c => {
            html += `
                <tr data-id="${c._id}">
                    <td class="country">${c.country}</td>
                    <td class="code">${c.code}</td>
                    <td class="name">${c.name || ""}</td>
                    <td class="action-cell">
                        <button class="edit-currency">Edit</button>
                        <button class="delete-currency">Delete</button>
                    </td>
                </tr>
            `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
    }

    async function loadRates() {

        const res = await fetch("/admin/rates", { credentials: "include" });
        const json = await res.json();

        const data = json.data; // ✅ FIX HERE

        if (!Array.isArray(data)) {
            console.error("Invalid rates response:", json);
            return;
        }

        let html = `
    <table>
    <thead>
    <tr>
        <th>From</th>
        <th>To</th>
        <th>Rate</th>
        <th>Actions</th>
    </tr>
    </thead>
    <tbody>

    <tr>
        <td><input id="rateFrom"></td>
        <td><input id="rateTo"></td>
        <td><input id="rateValue"></td>
        <td class="action-cell"><button data-action="create-rate">Create</button></td>
    </tr>
    `;

        data.forEach(r => {
            html += `
            <tr data-id="${r._id}">
                <td class="from">${r.fromCurrency}</td>
                <td class="to">${r.toCurrency}</td>
                <td class="rate">${r.rate}</td>
                <td class="action-cell">
                    <button class="edit-rate">Edit</button>
                    <button class="delete-rate">Delete</button>
                </td>
            </tr>
        `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
    }

    async function loadExpenseTypes() {

        try {
            const res = await fetch("/admin/expense-types", {
                credentials: "include"
            });

            const json = await res.json();

            // ✅ handle backend structure
            const data = json.data;

            // 🔒 safety check (prevents your crash)
            if (!Array.isArray(data)) {
                console.error("Invalid expense types response:", json);
                return;
            }

            let html = `
        <table>
        <thead>
        <tr>
            <th>Name</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>

        <!-- CREATE ROW -->
        <tr>
            <td><input id="expName" placeholder="Expense type name"></td>
            <td class="action-cell">
                <button data-action="create-expense">Create</button>
            </td>
        </tr>
        `;

            // ✅ render rows safely
            data.forEach(t => {
                html += `
                <tr data-id="${t._id}">
                    <td class="name">${t.name || ""}</td>
                    <td class="action-cell">
                        <button class="edit-expense">Edit</button>
                        <button class="delete-expense">Delete</button>
                    </td>
                </tr>
            `;
            });

            html += `</tbody></table>`;

            // ✅ render to DOM
            document.getElementById("settingsTableWrapper").innerHTML = html;

        } catch (err) {
            console.error("loadExpenseTypes error:", err);

            document.getElementById("settingsTableWrapper").innerHTML = `
            <p style="color:red;">Failed to load expense types</p>
        `;
        }
    }

    // =====================================================
    // GLOBAL ACTION HANDLER
    // =====================================================
    document.addEventListener("click", async (e) => {

        const row = e.target.closest("tr");

        // =====================================================
        // USERS (FULLY ISOLATED — DO NOT TOUCH BY SETTINGS)
        // =====================================================

        if (e.target.classList.contains("edit-user")) {

            row.dataset.original = row.innerHTML;

            row.innerHTML = `
                            <td><input value="${row.querySelector(".name").innerText}"></td>
                            <td><input value="${row.querySelector(".email").innerText}"></td>
                            <td><input value="${row.querySelector(".type").innerText}"></td>
                            <td><input value="${row.querySelector(".roles").innerText}"></td>
                            <td><input type="country" placeholder="Cuntry"></td>
                            <td><input type="area" placeholder="Area"></td>
                            <td><input value="${row.querySelector(".status").innerText}"></td>
                            <td><input type="password" placeholder="New password (optional)"></td>
                            <td class="action-cell">
                                <button class="save-user">Save</button>
                                <button class="cancel-user">Cancel</button>
                            </td>
                        `;
        }

        if (e.target.classList.contains("cancel-user")) {
            row.innerHTML = row.dataset.original;
        }

        if (e.target.classList.contains("save-user")) {

            if (!confirm("Save user changes?")) return;

            const passwordInput = row.querySelector('input[type="password"]');
            const password = passwordInput ? passwordInput.value.trim() : "";



            try {
                const res = await fetch(`/admin/users/${row.dataset.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        user_name: row.children[0].children[0].value,
                        user_email: row.children[1].children[0].value,
                        user_type: row.children[2].children[0].value,
                        roles: row.children[3].children[0].value
                            .split(",")
                            .map(r => r.trim()),
                        country: row.children[4].children[0].value,
                        area_section: row.children[5].children[0].value
                            .split(",")
                            .map(e => e.trim()),
                        status: row.children[6].children[0].value,
                        ...(password && { password })
                    })
                });

                const data = await res.json();

                if (!data.success) {
                    console.error("UPDATE FAILED:", data.message);
                    alert(data.message);
                    return;
                }

                loadUsers();

            } catch (err) {
                console.error("FETCH ERROR:", err);
                alert("Network or server error");
            }
        }

        if (e.target.classList.contains("delete-user")) {

            if (!confirm("Delete user?")) return;

            await fetch(`/admin/users/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadUsers();
        }


        if (e.target.classList.contains("cancel-request")) {
            row.innerHTML = row.dataset.original;
        }

        if (e.target.classList.contains("save-request")) {

            if (!confirm("Save request changes?")) return;
            await fetch(`/admin/requests/${row.dataset.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    requestNo: row.children[0].children[0].value,
                    userName: row.children[1].children[0].value,
                    totalAmountSAR: row.children[2].children[0].value,
                    status: row.children[3].children[0].value,
                })
            });

            loadRequests();
        }

        if (e.target.classList.contains("delete-request")) {

            const row = e.target.closest("tr");
            const id = row.dataset.id;

            if (!confirm("Delete request?")) return;

            // const res = await fetch(`/admin/requests/${id}`, {
            //     method: "DELETE",
            //     credentials: "include"
            // });

            const res = await fetch(`/admin/requests/${id}/cancel`, {
                method: "PUT",
                credentials: "include"
            });

            if (!res.ok) {
                console.error("DELETE failed");
                return;
            }

            loadRequests();
        }

        // ================= TOGGLE SUB TABLE =================
        // ================= VIEW REQUEST ITEMS =================
        if (e.target.classList.contains("view-request")) {

            const parentRow = e.target.closest("tr");
            const requestId = parentRow.dataset.id;

            if (parentRow.nextElementSibling?.classList.contains("sub-table-row")) {
                parentRow.nextElementSibling.remove();
                return;
            }

            document.querySelectorAll(".sub-table-row").forEach(el => el.remove());

            // 🔥 FORCE LOAD CACHE BEFORE USING DROPDOWN
            await Promise.all([
                loadCurrencies(),
                loadExpenseTypes()
            ]);

            await loadCurrencies();
            await loadExpenseTypes();

            await renderRequestItems(parentRow);
        }




        // ================= EDIT ITEM =================
        if (e.target.classList.contains("edit-item")) {

            const row = e.target.closest("tr");

            row.dataset.original = row.innerHTML;

            const currencyOptions = (currenciesCache || []).map(c =>
                `<option value="${c.code?.trim()}">${c.code?.trim()}</option>`
            ).join("");


            const expenseOptions = expenseTypesCache.map(t =>
                `<option value="${t.name}">${t.name}</option>`
            ).join("");

            row.innerHTML = `
        <td>${row.children[0].innerText}</td>

        <td><input value="${row.children[1].innerText}"></td>

        <td><input type="number" value="${row.children[2].innerText}"></td>

        <!-- CURRENCY DROPDOWN -->
        <td>
            <select class="currency-select">
                ${currencyOptions}
            </select>
        </td>

        <!-- EXPENSE TYPE DROPDOWN -->
        <td>
            <select class="expense-select">
                ${expenseOptions}
            </select>
        </td>

        <td><input value="${row.children[5].innerText}"></td>

        <td><input value="${row.children[6].innerText}"></td>

        <td><input type="number" value="${row.children[7].innerText}"></td>

        <td><input type="number" value="${row.children[8].innerText}"></td>

        <td>${row.children[9].innerText}</td>
        <td>${row.children[10].innerText}</td>

        <td>
            <select class="status-select">
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="canceled">canceled</option>
            </select>
        </td>

        <td class="action-cell">
            <button class="save-item">Save</button>
            <button class="cancel-item">Cancel</button>
        </td>
    `;

            // set current values properly
            const currencySelect = row.querySelector(".currency-select");
            const expenseSelect = row.querySelector(".expense-select");
            const statusSelect = row.querySelector(".status-select");

            // set selected values safely
            currencySelect.value = row.dataset.currency?.trim() || row.children[3].innerText.trim();
            expenseSelect.value = row.dataset.expense?.trim() || row.children[4].innerText.trim();
            statusSelect.value = row.dataset.status?.trim() || "pending";
        }


        // ================= CANCEL ITEM EDIT =================
        if (e.target.classList.contains("cancel-item")) {

            const row = e.target.closest("tr");
            row.innerHTML = row.dataset.original;
        }


        // ================= SAVE ITEM =================
        if (e.target.classList.contains("save-item")) {

            if (!confirm("Save item changes?")) return;

            const row = e.target.closest("tr");
            const id = row.dataset.id;

            const inputs = row.querySelectorAll("input");
            const selects = row.querySelectorAll("select");

            const payload = {
                customerId: inputs[0].value,
                amount: Number(inputs[1].value),

                currency: selects[0].value,
                expenseType: selects[1].value,

                purpose: inputs[2].value,
                doctorName: inputs[3].value,

                requestPeriodMonth: Number(inputs[4].value),
                requestPeriodYear: Number(inputs[5].value),

                status: selects[2].value
            };

            const res = await fetch(`/admin/requests/items/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                alert("Update failed");
                return;
            }

            // 🔥 refresh ONLY this request
            const parentRow = row.closest(".sub-table-row").previousElementSibling;
            await renderRequestItems(parentRow);

            loadRequests();
        }

        async function renderRequestItems(parentRow) {

            const requestId = parentRow.dataset.id;

            const res = await fetch(`/admin/requests/${requestId}/items`, {
                credentials: "include"
            });

            const items = await res.json();

            // ❌ remove old table first (IMPORTANT FIX)
            const old = parentRow.nextElementSibling;
            if (old?.classList.contains("sub-table-row")) {
                old.remove();
            }

            const subRow = document.createElement("tr");
            subRow.classList.add("sub-table-row");

            subRow.innerHTML = `
        <td colspan="12">
            <table class="sub-table">
                <tbody>
                    ${items.map(item => `
                        <tr data-id="${item._id}"
                            data-currency="${item.currency}"
                            data-expense="${item.expenseType}"
                            data-status="${item.status || 'pending'}">

                            <td>${item.subRequestNo}</td>
                            <td>${item.customerId || "-"}</td>
                            <td>${item.amount}</td>
                            <td>${item.currency}</td>
                            <td>${item.expenseType}</td>
                            <td>${item.purpose}</td>
                            <td>${item.doctorName}</td>
                            <td>${item.requestPeriodMonth}</td>
                            <td>${item.requestPeriodYear}</td>
                            <td>${item.exchangeRate}</td>
                            <td>${item.amountSAR}</td>

                            <td class="action-cell">
                                <button class="edit-item">Edit</button>
                                <button class="delete-item">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </td>
    `;

            parentRow.insertAdjacentElement("afterend", subRow);
        }
        async function loadCurrencies() {

            const res = await fetch("/admin/currencies", {
                credentials: "include"
            });

            const json = await res.json();

            console.log("Currencies API response:", json); // 👈 debug

            // ✅ FIX: support both formats (safe fallback)
            const data = Array.isArray(json)
                ? json
                : json.currencies || [];

            if (!Array.isArray(data)) {
                console.error("Invalid currency response:", json);
                return;
            }

            currenciesCache = data;

            let html = `
    <table>
    <thead>
        <tr>
            <th>Country</th>
            <th>Code</th>
            <th>Name</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>

        <tr>
            <td><input id="curCountry"></td>
            <td><input id="curCode"></td>
            <td><input id="curName"></td>
            <td class="action-cell"><button data-action="create-currency">Create</button></td>
        </tr>
    `;

            data.forEach(c => {
                html += `
            <tr data-id="${c.code}">
                <td class="country">${c.name || ""}</td>
                <td class="code">${c.code}</td>
                <td class="name">${c.name || ""}</td>
                <td class="action-cell">
                    <button class="edit-currency">Edit</button>
                    <button class="delete-currency">Delete</button>
                </td>
            </tr>
        `;
            });

            wrapper.innerHTML = html + "</tbody></table>";
        }

        async function loadExpenseTypes() {

            const res = await fetch("/admin/expense-types", {
                credentials: "include"
            });

            const json = await res.json();

            if (!json.success) {
                console.error("Failed to load expense types:", json);
                return;
            }

            const data = json.data;

            expenseTypesCache = data; // ✅ used for dropdowns

            let html = `
    <table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>

        <tr>
            <td><input id="expName" placeholder="Expense type"></td>
            <td class="action-cell"><button data-action="create-expense">Create</button></td>
        </tr>
    `;

            data.forEach(t => {
                html += `
            <tr data-id="${t._id}">
                <td class="name">${t.name}</td>
                <td class="action-cell">
                    <button class="edit-expense">Edit</button>
                    <button class="delete-expense">Delete</button>
                </td>
            </tr>
        `;
            });

            wrapper.innerHTML = html + "</tbody></table>";
        }

        // =====================================================
        // SETTINGS (SEPARATE BLOCK — SAFE)
        // =====================================================

        // ========= CREATE =========
        if (e.target.dataset.action === "create-currency") {

            if (!confirm("Create currency?")) return;

            await fetch("/admin/currencies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    country: curCountry.value,
                    code: curCode.value,
                    name: curName.value
                })
            });

            loadCurrencies();
        }

        if (e.target.dataset.action === "create-rate") {

            if (!confirm("Create rate?")) return;

            await fetch("/admin/rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    fromCurrency: rateFrom.value,
                    toCurrency: rateTo.value,
                    rate: rateValue.value
                })
            });

            loadRates();
        }

        if (e.target.dataset.action === "create-expense") {

            if (!confirm("Create expense type?")) return;

            await fetch("/admin/expense-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: expName.value
                })
            });

            loadExpenseTypes();
        }

        // ========= DELETE =========
        if (e.target.classList.contains("delete-currency")) {

            if (!confirm("Delete currency?")) return;

            await fetch(`/admin/currencies/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadCurrencies();
        }

        if (e.target.classList.contains("delete-rate")) {

            if (!confirm("Delete rate?")) return;

            await fetch(`/admin/rates/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadRates();
        }

        if (e.target.classList.contains("delete-expense")) {

            if (!confirm("Delete expense type?")) return;

            await fetch(`/admin/expense-types/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadExpenseTypes();
        }

        // ========= EDIT SETTINGS =========
        if (
            e.target.classList.contains("edit-currency") ||
            e.target.classList.contains("edit-rate") ||
            e.target.classList.contains("edit-expense")
        ) {

            row.dataset.original = row.innerHTML;

            const cells = row.querySelectorAll("td");

            cells.forEach((cell, index) => {
                if (index < cells.length - 1) {
                    cell.innerHTML = `<input value="${cell.innerText}">`;
                }
            });

            row.lastElementChild.innerHTML = `
            <button class="save-setting">Save</button>
            <button class="cancel-setting">Cancel</button>
        `;
        }

        // ========= SAVE SETTINGS =========
        if (e.target.classList.contains("save-setting")) {

            if (!confirm("Save changes?")) return;

            const inputs = row.querySelectorAll("input");
            const values = Array.from(inputs).map(i => i.value);

            let url = "";
            let payload = {};

            if (title.innerText === "Currencies") {
                url = `/admin/currencies/${row.dataset.id}`;
                payload = { country: values[0], code: values[1], name: values[2] };
            }

            if (title.innerText === "Exchange Rates") {
                url = `/admin/rates/${row.dataset.id}`;
                payload = { fromCurrency: values[0], toCurrency: values[1], rate: values[2] };
            }

            if (title.innerText === "Expense Types") {
                url = `/admin/expense-types/${row.dataset.id}`;
                payload = { name: values[0] };
            }

            await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (title.innerText === "Currencies") loadCurrencies();
            if (title.innerText === "Exchange Rates") loadRates();
            if (title.innerText === "Expense Types") loadExpenseTypes();
        }

        // ========= CANCEL SETTINGS =========
        if (e.target.classList.contains("cancel-setting")) {
            row.innerHTML = row.dataset.original;
        }

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

    async function loadRequests() {
        try {
            const res = await fetch("/admin/requests", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data; // ✅ FIX

            if (!Array.isArray(data)) {
                console.error("Invalid requests response:", json);
                return;
            }

            const body = document.getElementById("requestsTableBody");
            body.innerHTML = "";

            data.forEach(r => {
                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                    <td class="requestNo">${r.requestNo || ""}</td>
                    <td class="userName">${r.userName || ""}</td>
                    <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                    <td class="status">${r.status || "pending"}</td>
                    <td class="userName">${r.currentRole || ""}</td>
                    <td class="attachments">
                        ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}
                    </td>
                    <td class="action-cell">
                        <button class="view-request">View</button>
                        <button class="delete-request">Cancel Request</button>
                    </td>
            `;
                {/* <button class="edit-request">Edit</button> */ }
                body.appendChild(tr);
            });

        } catch (err) {
            console.error("loadRequests error:", err);
        }
    }

});



document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");
    const wrapper = document.getElementById("settingsTableWrapper");
    const title = document.getElementById("settingsTitle");

    // ================= NAV =================
    document.querySelectorAll(".nav-links button[data-section]")
        .forEach(btn => {
            btn.addEventListener("click", () => {

                const section = btn.dataset.section;

                document.querySelectorAll(".section")
                    .forEach(s => s.classList.remove("active"));

                document.getElementById(section + "Section").classList.add("active");

                if (section === "users") loadUsers();
                if (section === "requests") loadRequests();
            });
        });

    // =====================================================
    // USERS
    // =====================================================
    async function loadUsers() {

        const res = await fetch("/admin/users", { credentials: "include" });
        const data = await res.json();

        const body = document.getElementById("usersTableBody");
        body.innerHTML = "";

        data.forEach(u => {
            body.innerHTML += `
  
                    <tr data-id="${u._id}">
                        <td class="name">${u.user_name}</td>
                        <td class="email">${u.user_email}</td>
                        <td class="type">${u.user_type}</td>
                        <td class="roles">${(u.roles || []).join(", ")}</td>
                        <td class="type">${u.country}</td>
                        <td class="type">${(u.area_section || []).join(", ")}</td>
                        <td class="status">${u.status}</td>
                        <td class="password"></td>
                        <td class="action-cell">
                            <button class="edit-user">Edit</button>
                            <button class="delete-user">Delete</button>
                        </td>
                    </tr>
                    `;
        });
    }

    // =====================================================
    // ADMIN REQUESTS (FIXED + SCOPED PROPERLY)
    // =====================================================
    async function loadRequests() {
        try {
            const res = await fetch("/admin/requests", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data; // ✅ FIX

            if (!Array.isArray(data)) {
                console.error("Invalid requests response:", json);
                return;
            }

            const body = document.getElementById("requestsTableBody");
            body.innerHTML = "";

            data.forEach(r => {
                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                    <td class="requestNo">${r.requestNo || ""}</td>
                    <td class="userName">${r.userName || ""}</td>
                    <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                    <td class="status">${r.status || "pending"}</td>
                    <td class="userName">${r.currentRole || ""}</td>
                    <td class="attachments">
                        ${((r.attachments || []).map(file => FileHandler.render(file)).join(""))}
                    </td>
                    <td class="action-cell">
                        <button class="view-request">View</button>
                        <button class="delete-request">Cancel Request</button>
                    </td>
            `;

                body.appendChild(tr);
            });
            // button class="edit-request">Edit</button
        } catch (err) {
            console.error("loadRequests error:", err);
        }
    }


    // =====================================================
    // SETTINGS LOADERS (UNCHANGED)
    // =====================================================
    async function loadCurrencies() {

        const res = await fetch("/admin/currencies", { credentials: "include" });
        const data = await res.json();

        let html = `
        <table>
        <thead>
        <tr>
            <th>Country</th>
            <th>Code</th>
            <th>Name</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>

        <tr>
            <td><input id="curCountry"></td>
            <td><input id="curCode"></td>
            <td><input id="curName"></td>
            <td class="action-cell"><button data-action="create-currency">Create</button></td>
        </tr>
        `;

        data.forEach(c => {
            html += `
                <tr data-id="${c._id}">
                    <td class="country">${c.country}</td>
                    <td class="code">${c.code}</td>
                    <td class="name">${c.name || ""}</td>
                    <td class="action-cell">
                        <button class="edit-currency">Edit</button>
                        <button class="delete-currency">Delete</button>
                    </td>
                </tr>
            `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
    }

    async function loadRates() {

        const res = await fetch("/admin/rates", { credentials: "include" });
        const data = await res.json();

        let html = `
        <table>
        <thead>
        <tr>
            <th>From</th>
            <th>To</th>
            <th>Rate</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>

        <tr>
            <td><input id="rateFrom"></td>
            <td><input id="rateTo"></td>
            <td><input id="rateValue"></td>
            <td class="action-cell"><button data-action="create-rate">Create</button></td>
        </tr>
        `;

        data.forEach(r => {
            html += `
                <tr data-id="${r._id}">
                    <td class="from">${r.fromCurrency}</td>
                    <td class="to">${r.toCurrency}</td>
                    <td class="rate">${r.rate}</td>
                    <td class="action-cell">
                        <button class="edit-rate">Edit</button>
                        <button class="delete-rate">Delete</button>
                    </td>
                </tr>
            `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
    }

    async function loadExpenseTypes() {

        const res = await fetch("/admin/expense-types", { credentials: "include" });
        const data = await res.json();

        let html = `
        <table>
        <thead>
        <tr>
            <th>Name</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>

        <tr>
            <td><input id="expName"></td>
            <td class="action-cell"><button data-action="create-expense">Create</button></td>
        </tr>
        `;

        data.forEach(t => {
            html += `
                <tr data-id="${t._id}">
                    <td class="name">${t.name}</td>
                    <td class="action-cell">
                        <button class="edit-expense">Edit</button>
                        <button class="delete-expense">Delete</button>
                    </td>
                </tr>
            `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
    }

    // =====================================================
    // GLOBAL ACTION HANDLER (UNCHANGED)
    // =====================================================
    document.addEventListener("click", async (e) => {

        const row = e.target.closest("tr");

        // (your existing logic stays untouched)
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

});