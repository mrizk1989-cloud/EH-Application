let requestsCache = [];
let currenciesCache = [];
let expenseTypesCache = [];

import FileHandler from "./utils/fileHandler.js";
import ExportModule from "./utils/exportModule.js";
import ImportModule from "./utils/importModule.js";
import EhPolicyModule from "./utils/ehPolicyModule.js";
import { formatNumber } from "./utils/format.js";
import PolicyModule from "./utils/PolicyModule.js";

// =====================================================
// THEME
// =====================================================

function setTheme(mode) {

    document.documentElement.setAttribute("data-theme", mode);

    localStorage.setItem("theme", mode);

    const themeBtn =
        document.getElementById("themeToggleBtn");

    if (themeBtn) {

        themeBtn.textContent =
            mode === "dark"
                ? "Light"
                : "Dark";
    }
}

const savedTheme =
    localStorage.getItem("theme") || "light";

setTheme(savedTheme);

// =====================================================
// MAIN
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // DOM
    // =====================================================

    const logoutBtn =
        document.getElementById("logoutBtn");

    const wrapper =
        document.getElementById("settingsTableWrapper");

    const title =
        document.getElementById("settingsTitle");

    const dropdown =
        document.getElementById("settingsDropdown");

    const dropdownBtn =
        document.getElementById("dropdownBtn");

    const themeBtn =
        document.getElementById("themeToggleBtn");

    // =====================================================
    // INIT
    // =====================================================

    FileHandler.init();

    // =====================================================
    // THEME
    // =====================================================

    async function initExportModule() {

        const res = await fetch("/api/me", {
            credentials: "include"
        });

        const data = await res.json();

        // console.log("USER INFO:", data);

        const user = data.user || data;

        const roles = Array.isArray(user.roles)
            ? user.roles
            : (user.roles ? [user.roles] : []);

        // console.log("ROLES:", roles);

        const isAdmin = roles.includes("admin");

        // console.log("IS ADMIN:", isAdmin);

        ExportModule.setRole(isAdmin ? "admin" : "user");
    }

    await initExportModule();
    ExportModule.render("exportContainer");

    themeBtn?.addEventListener("click", () => {

        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        setTheme(newTheme);
    });

    // =====================================================
    // NAVIGATION
    // =====================================================

    document
        .querySelectorAll(".nav-links button[data-section]")
        .forEach(btn => {

            btn.addEventListener("click", async () => {

                const section = btn.dataset.section;

                document
                    .querySelectorAll(".section")
                    .forEach(s => s.classList.remove("active"));

                document
                    .getElementById(section + "Section")
                    ?.classList.add("active");

                if (section === "users") {
                    await loadUsers();
                }

                if (section === "requests") {
                    await loadRequestFilters();
                    await loadRequests();
                }

                if (section === "export") {

                    ExportModule.render("exportContainer");

                    ImportModule.render("importContainer");

                    PolicyModule.render("uploadContainer");
                }

                if (section === "eh-policy") {

                    EhPolicyModule.render("ehPolicyContainer");
                }
            });
        });

    // =====================================================
    // SETTINGS DROPDOWN
    // =====================================================

    dropdownBtn?.addEventListener("click", (e) => {

        e.stopPropagation();

        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {

        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });

    document.addEventListener("click", async (e) => {

        const item =
            e.target.closest(".dropdown-item");

        if (!item) return;

        const value = item.dataset.value;

        document
            .querySelectorAll(".section")
            .forEach(s => s.classList.remove("active"));

        document
            .getElementById("settingsSection")
            ?.classList.add("active");

        if (value === "rates") {

            title.innerText = "Exchange Rates";

            await loadRates();
        }

        if (value === "currencies") {

            title.innerText = "Currencies";

            await loadCurrencies();
        }

        if (value === "expenseTypes") {

            title.innerText = "Expense Types";

            await loadExpenseTypes();
        }
    });

    // =====================================================
    // SEARCH REQUESTS
    // =====================================================

    document
        .getElementById("searchRequestsBtn")
        ?.addEventListener("click", loadRequests);

    // =====================================================
    // GLOBAL CLICK HANDLER
    // =====================================================

    document.addEventListener("click", async (e) => {

        const row = e.target.closest("tr");

        // =====================================================
        // USERS
        // =====================================================

        if (e.target.classList.contains("edit-user")) {

            row.dataset.original = row.innerHTML;

            row.innerHTML = `
                <td><input value="${row.querySelector(".name").innerText}"></td>
                <td><input value="${row.querySelector(".email").innerText}"></td>
                <td><input value="${row.querySelector(".type").innerText}"></td>
                <td><input value="${row.querySelector(".roles").innerText}"></td>
                <td><input value="${row.children[4].innerText}"></td>
                <td><input value="${row.children[5].innerText}"></td>
                <td><input value="${row.querySelector(".status").innerText}"></td>
                <td><input type="password" placeholder="New password"></td>

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

            const passwordInput =
                row.querySelector('input[type="password"]');

            const password =
                passwordInput?.value.trim();

            const payload = {

                user_name:
                    row.children[0].children[0].value,

                user_email:
                    row.children[1].children[0].value,

                user_type:
                    row.children[2].children[0].value,

                roles:
                    row.children[3]
                        .children[0]
                        .value
                        .split(",")
                        .map(r => r.trim()),

                country:
                    row.children[4].children[0].value,

                area_section:
                    row.children[5]
                        .children[0]
                        .value
                        .split(",")
                        .map(a => a.trim()),

                status:
                    row.children[6].children[0].value
            };

            if (password) {
                payload.password = password;
            }

            const res = await fetch(
                `/admin/users/${row.dataset.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json();

            if (!data.success) {
                alert(data.message || "Update failed");
                return;
            }

            await loadUsers();
        }

        if (e.target.classList.contains("delete-user")) {

            if (!confirm("Delete user?")) return;

            await fetch(`/admin/users/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            await loadUsers();
        }

        // =====================================================
        // REQUESTS
        // =====================================================

        if (e.target.classList.contains("delete-request")) {

            if (!confirm("Cancel request?")) return;

            const res = await fetch(
                `/admin/requests/${row.dataset.id}/cancel`,
                {
                    method: "PUT",
                    credentials: "include"
                }
            );

            if (!res.ok) {
                alert("Failed to cancel request");
                return;
            }

            await loadRequests();
        }

        // =====================================================
        // VIEW REQUEST ITEMS
        // =====================================================

        if (e.target.classList.contains("view-request")) {

            const parentRow =
                e.target.closest("tr");

            if (
                parentRow.nextElementSibling?.classList.contains("sub-table-row")
            ) {

                parentRow.nextElementSibling.remove();

                return;
            }

            document
                .querySelectorAll(".sub-table-row")
                .forEach(el => el.remove());

            await Promise.all([
                fetchCurrenciesCache(),
                fetchExpenseTypesCache()
            ]);

            await renderRequestItems(parentRow);
        }

        // =====================================================
        // EDIT ITEM
        // =====================================================

        if (e.target.classList.contains("edit-item")) {

            row.dataset.original = row.innerHTML;

            const currencyOptions =
                currenciesCache.map(c => `
                    <option value="${c.code}">
                        ${c.code}
                    </option>
                `).join("");

            const expenseOptions =
                expenseTypesCache.map(t => `
                    <option value="${t.name}">
                        ${t.name}
                    </option>
                `).join("");

            row.innerHTML = `
                <td>${row.children[0].innerText}</td>

                <td>
                    <input value="${row.children[1].innerText}">
                </td>

                <td>
                    <input type="number" value="${row.children[2].innerText}">
                </td>

                <td>
                    <select class="currency-select">
                        ${currencyOptions}
                    </select>
                </td>

                <td>
                    <select class="expense-select">
                        ${expenseOptions}
                    </select>
                </td>

                <td>
                    <input value="${row.children[5].innerText}">
                </td>

                <td>
                    <input value="${row.children[6].innerText}">
                </td>

                <td>
                    <input type="number" value="${row.children[7].innerText}">
                </td>

                <td>
                    <input type="number" value="${row.children[8].innerText}">
                </td>

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

            row.querySelector(".currency-select").value =
                row.dataset.currency;

            row.querySelector(".expense-select").value =
                row.dataset.expense;

            row.querySelector(".status-select").value =
                row.dataset.status || "pending";
        }

        if (e.target.classList.contains("cancel-item")) {

            row.innerHTML = row.dataset.original;
        }

        if (e.target.classList.contains("save-item")) {

            if (!confirm("Save item changes?")) return;

            const inputs =
                row.querySelectorAll("input");

            const selects =
                row.querySelectorAll("select");

            const payload = {

                customerId: inputs[0].value,

                amount: Number(inputs[1].value),

                currency: selects[0].value,

                expenseType: selects[1].value,

                purpose: inputs[2].value,

                doctorName: inputs[3].value,

                requestPeriodMonth:
                    Number(inputs[4].value),

                requestPeriodYear:
                    Number(inputs[5].value),

                status: selects[2].value
            };

            const res = await fetch(
                `/admin/requests/items/${row.dataset.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json();

            if (!data.success) {
                alert("Update failed");
                return;
            }

            const parentRow =
                row.closest(".sub-table-row")
                    .previousElementSibling;

            await renderRequestItems(parentRow);

            await loadRequests();
        }

        // =====================================================
        // SETTINGS CREATE
        // =====================================================

        if (e.target.dataset.action === "create-currency") {

            await fetch("/admin/currencies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    country: curCountry.value,
                    code: curCode.value,
                    name: curName.value
                })
            });

            await loadCurrencies();
        }

        if (e.target.dataset.action === "create-rate") {

            await fetch("/admin/rates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    fromCurrency: rateFrom.value,
                    toCurrency: rateTo.value,
                    rate: rateValue.value
                })
            });

            await loadRates();
        }

        if (e.target.dataset.action === "create-expense") {

            await fetch("/admin/expense-types", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    name: expName.value
                })
            });

            await loadExpenseTypes();
        }

        // =====================================================
        // SETTINGS DELETE
        // =====================================================

        if (e.target.classList.contains("delete-currency")) {

            await fetch(
                `/admin/currencies/${row.dataset.id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            await loadCurrencies();
        }

        if (e.target.classList.contains("delete-rate")) {

            await fetch(
                `/admin/rates/${row.dataset.id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            await loadRates();
        }

        if (e.target.classList.contains("delete-expense")) {

            await fetch(
                `/admin/expense-types/${row.dataset.id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            await loadExpenseTypes();
        }

        // =====================================================
        // SETTINGS EDIT
        // =====================================================

        if (
            e.target.classList.contains("edit-currency") ||
            e.target.classList.contains("edit-rate") ||
            e.target.classList.contains("edit-expense")
        ) {

            row.dataset.original = row.innerHTML;

            const cells =
                row.querySelectorAll("td");

            cells.forEach((cell, index) => {

                if (index < cells.length - 1) {

                    cell.innerHTML =
                        `<input value="${cell.innerText}">`;
                }
            });

            row.lastElementChild.innerHTML = `
                <button class="save-setting">Save</button>
                <button class="cancel-setting">Cancel</button>
            `;
        }

        if (e.target.classList.contains("cancel-setting")) {

            row.innerHTML = row.dataset.original;
        }

        if (e.target.classList.contains("save-setting")) {

            const inputs =
                row.querySelectorAll("input");

            const values =
                Array.from(inputs).map(i => i.value);

            let url = "";
            let payload = {};

            if (title.innerText === "Currencies") {

                url =
                    `/admin/currencies/${row.dataset.id}`;

                payload = {
                    country: values[0],
                    code: values[1],
                    name: values[2]
                };
            }

            if (title.innerText === "Exchange Rates") {

                url =
                    `/admin/rates/${row.dataset.id}`;

                payload = {
                    fromCurrency: values[0],
                    toCurrency: values[1],
                    rate: values[2]
                };
            }

            if (title.innerText === "Expense Types") {

                url =
                    `/admin/expense-types/${row.dataset.id}`;

                payload = {
                    name: values[0]
                };
            }

            await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (title.innerText === "Currencies") {
                await loadCurrencies();
            }

            if (title.innerText === "Exchange Rates") {
                await loadRates();
            }

            if (title.innerText === "Expense Types") {
                await loadExpenseTypes();
            }
        }
    });

    // =====================================================
    // LOGOUT
    // =====================================================

    logoutBtn?.addEventListener("click", async () => {

        if (!confirm("Logout?")) return;

        await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        window.location.href = "/";
    });
});

// =====================================================
// USERS
// =====================================================

async function loadUsers() {

    const res = await fetch("/admin/users", {
        credentials: "include"
    });

    const data = await res.json();

    const body =
        document.getElementById("usersTableBody");

    body.innerHTML = "";

    data.forEach(u => {

        body.innerHTML += `
            <tr data-id="${u._id}">
                <td class="name">${u.user_name}</td>
                <td class="email">${u.user_email}</td>
                <td class="type">${u.user_type}</td>
                <td class="roles">${(u.roles || []).join(", ")}</td>
                <td>${u.country || ""}</td>
                <td>${(u.area_section || []).join(", ")}</td>
                <td class="status">${u.status}</td>
                <td></td>

                <td class="action-cell">
                    <button class="edit-user">Edit</button>
                    <button class="delete-user">Delete</button>
                </td>
            </tr>
        `;
    });
}

// =====================================================
// REQUESTS
// =====================================================

async function loadRequests() {

    try {

        const userName =
            document.getElementById("filterUser")?.value;

        const year =
            document.getElementById("filterYear")?.value;

        const status =
            document.getElementById("filterStatus")?.value;

        const currentRole =
            document.getElementById("filterRole")?.value;

        const params =
            new URLSearchParams();

        if (userName)
            params.append("userName", userName);

        if (year)
            params.append("year", year);

        if (status)
            params.append("status", status);

        if (currentRole)
            params.append("currentRole", currentRole);

        const res = await fetch(
            `/admin/requests?${params.toString()}`,
            {
                credentials: "include"
            }
        );

        const json = await res.json();

        const data =
            json.data || [];

        const body =
            document.getElementById("requestsTableBody");

        body.innerHTML = "";

        data.forEach(r => {

            const tr =
                document.createElement("tr");

            tr.dataset.id = r._id;

            tr.innerHTML = `
                <td>${r.requestNo || ""}</td>
                <td>${r.userName || ""}</td>
                <td>${formatNumber(r.totalAmountSAR || 0)}</td>
                <td>${r.status || "pending"}</td>
                <td>${r.currentRole || ""}</td>

                <td class="attachments">
                    ${(r.attachments || [])
                    .map(file => FileHandler.render(file))
                    .join("")}
                </td>

                <td>${formatNumber(r.remainingBudgetSAR)}</td>

                <td class="action-cell">
                    <button class="view-request">
                        View
                    </button>

                    <button class="delete-request">
                        Cancel Request
                    </button>
                </td>
            `;

            body.appendChild(tr);
        });

    } catch (err) {

        console.error("loadRequests error:", err);
    }
}

// =====================================================
// REQUEST ITEMS
// =====================================================

async function renderRequestItems(parentRow) {

    const requestId =
        parentRow.dataset.id;

    const res = await fetch(
        `/admin/requests/${requestId}/items`,
        {
            credentials: "include"
        }
    );

    const items = await res.json();

    const old =
        parentRow.nextElementSibling;

    if (old?.classList.contains("sub-table-row")) {
        old.remove();
    }

    const subRow =
        document.createElement("tr");

    subRow.classList.add("sub-table-row");

    subRow.innerHTML = `
        <td colspan="12">

            <table class="sub-table">

                <tbody>

                    ${items.map(item => `

                        <tr
                            data-id="${item._id}"
                            data-currency="${item.currency}"
                            data-expense="${item.expenseType}"
                            data-status="${item.status || "pending"}"
                        >

                            <td>${item.subRequestNo}</td>
                            <td>${item.customerId || "-"}</td>
                            <td>${formatNumber(item.amount)}</td>
                            <td>${item.currency}</td>
                            <td>${item.expenseType}</td>
                            <td>${item.purpose}</td>
                            <td>${item.doctorName}</td>
                            <td>${item.requestPeriodMonth}</td>
                            <td>${item.requestPeriodYear}</td>
                            <td>${formatNumber(item.exchangeRate)}</td>
                            <td>${formatNumber(item.amountSAR)}</td>

                            <td class="action-cell">
                                <button class="edit-item">
                                    Edit
                                </button>
                            </td>

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
}

// =====================================================
// REQUEST FILTERS
// =====================================================

async function loadRequestFilters() {

    try {

        const res =
            await fetch("/admin/requests/filters");

        const json =
            await res.json();

        if (!json.success) return;

        const {
            users,
            statuses,
            roles,
            years
        } = json.data;

        const userSelect =
            document.getElementById("filterUser");

        const yearSelect =
            document.getElementById("filterYear");

        const statusSelect =
            document.getElementById("filterStatus");

        const roleSelect =
            document.getElementById("filterRole");

        userSelect.innerHTML =
            `<option value="">All Users</option>`;

        yearSelect.innerHTML =
            `<option value="">All Years</option>`;

        statusSelect.innerHTML =
            `<option value="">All Statuses</option>`;

        roleSelect.innerHTML =
            `<option value="">All Roles</option>`;

        users.forEach(user => {

            userSelect.innerHTML += `
                <option value="${user}">
                    ${user}
                </option>
            `;
        });

        years.forEach(year => {

            yearSelect.innerHTML += `
                <option value="${year}">
                    ${year}
                </option>
            `;
        });

        statuses.forEach(status => {

            statusSelect.innerHTML += `
                <option value="${status}">
                    ${status}
                </option>
            `;
        });

        roles.forEach(role => {

            roleSelect.innerHTML += `
                <option value="${role}">
                    ${role}
                </option>
            `;
        });

    } catch (err) {

        console.error(
            "loadRequestFilters error:",
            err
        );
    }
}

// =====================================================
// CACHE LOADERS
// =====================================================

async function fetchCurrenciesCache() {

    const res = await fetch("/admin/currencies", {
        credentials: "include"
    });

    const json = await res.json();

    currenciesCache =
        json.data ||
        json.currencies ||
        [];
}

async function fetchExpenseTypesCache() {

    const res = await fetch("/admin/expense-types", {
        credentials: "include"
    });

    const json = await res.json();

    expenseTypesCache =
        json.data || [];
}

// =====================================================
// SETTINGS
// =====================================================

async function loadCurrencies() {

    const res = await fetch("/admin/currencies", {
        credentials: "include"
    });

    const json = await res.json();

    const data =
        json.data ||
        json.currencies ||
        [];

    const wrapper =
        document.getElementById("settingsTableWrapper");

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

                    <td class="action-cell">
                        <button data-action="create-currency">
                            Create
                        </button>
                    </td>
                </tr>
    `;

    data.forEach(c => {

        html += `
            <tr data-id="${c._id}">

                <td>${c.country || ""}</td>
                <td>${c.code || ""}</td>
                <td>${c.name || ""}</td>

                <td class="action-cell">

                    <button class="edit-currency">
                        Edit
                    </button>

                    <button class="delete-currency">
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    wrapper.innerHTML = html;
}

async function loadRates() {

    const res = await fetch("/admin/rates", {
        credentials: "include"
    });

    const json = await res.json();

    const data =
        json.data || [];

    const wrapper =
        document.getElementById("settingsTableWrapper");

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

                    <td class="action-cell">
                        <button data-action="create-rate">
                            Create
                        </button>
                    </td>
                </tr>
    `;

    data.forEach(r => {

        html += `
            <tr data-id="${r._id}">

                <td>${r.fromCurrency}</td>
                <td>${r.toCurrency}</td>
                <td>${formatNumber(r.rate)}</td>

                <td class="action-cell">

                    <button class="edit-rate">
                        Edit
                    </button>

                    <button class="delete-rate">
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    wrapper.innerHTML = html;
}

async function loadExpenseTypes() {

    const res = await fetch("/admin/expense-types", {
        credentials: "include"
    });

    const json = await res.json();

    const data =
        json.data || [];

    const wrapper =
        document.getElementById("settingsTableWrapper");

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
                    <td>
                        <input id="expName">
                    </td>

                    <td class="action-cell">

                        <button data-action="create-expense">
                            Create
                        </button>

                    </td>
                </tr>
    `;

    data.forEach(t => {

        html += `
            <tr data-id="${t._id}">

                <td>${t.name}</td>

                <td class="action-cell">

                    <button class="edit-expense">
                        Edit
                    </button>

                    <button class="delete-expense">
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    wrapper.innerHTML = html;
}