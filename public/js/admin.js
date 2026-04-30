document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".nav-links button[data-section]");
    const logoutBtn = document.getElementById("logoutBtn");

    const dropdown = document.getElementById("settingsDropdown");
    const dropdownBtn = document.getElementById("dropdownBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");

    const wrapper = document.getElementById("settingsTableWrapper");
    const title = document.getElementById("settingsTitle");

    let currentSettingsView = null;

    // ================= NAV =================
    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {
            const section = btn.dataset.section;

            document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
            document.getElementById(section + "Section").classList.add("active");

            if (section === "users") loadUsers();
            if (section === "requests") loadRequests();
        });
    });

    // ================= DROPDOWN =================
    dropdownBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
    });

    dropdownMenu.addEventListener("click", async (e) => {

        const item = e.target.closest(".dropdown-item");
        if (!item) return;

        const value = item.dataset.value;
        currentSettingsView = value;

        document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
        document.getElementById("settingsSection").classList.add("active");

        dropdown.classList.remove("open");

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
    // USERS (WITH EDIT / SAVE / CANCEL)
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
                    <td class="actions">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    // ONE CLEAN EVENT DELEGATION (FIXES MULTIPLE CLICK BUGS)
    document.addEventListener("click", async (e) => {

        const row = e.target.closest("tr");
        if (!row) return;

        // ================= EDIT =================
        if (e.target.classList.contains("edit-btn")) {

            if (row.classList.contains("editing")) return;

            row.classList.add("editing");

            row.dataset.original = JSON.stringify({
                name: row.querySelector(".name").innerText,
                email: row.querySelector(".email").innerText,
                type: row.querySelector(".type").innerText,
                roles: row.querySelector(".roles").innerText
            });

            row.querySelector(".name").innerHTML = `<input value="${row.querySelector(".name").innerText}">`;
            row.querySelector(".email").innerHTML = `<input value="${row.querySelector(".email").innerText}">`;
            row.querySelector(".type").innerHTML = `<input value="${row.querySelector(".type").innerText}">`;
            row.querySelector(".roles").innerHTML = `<input value="${row.querySelector(".roles").innerText}">`;

            row.querySelector(".actions").innerHTML = `
                <button class="save-btn">Save</button>
                <button class="cancel-btn">Cancel</button>
            `;
        }

        // ================= CANCEL =================
        if (e.target.classList.contains("cancel-btn")) {

            const original = JSON.parse(row.dataset.original);

            row.querySelector(".name").innerText = original.name;
            row.querySelector(".email").innerText = original.email;
            row.querySelector(".type").innerText = original.type;
            row.querySelector(".roles").innerText = original.roles;

            loadUsers(); // reset clean state
        }

        // ================= SAVE =================
        if (e.target.classList.contains("save-btn")) {

            if (!confirm("Save changes?")) return;

            const id = row.dataset.id;

            const payload = {
                user_name: row.querySelector(".name input").value,
                user_email: row.querySelector(".email input").value,
                user_type: row.querySelector(".type input").value,
                roles: row.querySelector(".roles input").value.split(",").map(r => r.trim())
            };

            await fetch(`/admin/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            loadUsers();
        }

        // ================= DELETE =================
        if (e.target.classList.contains("delete-btn")) {

            if (!confirm("Delete this user?")) return;

            const id = row.dataset.id;

            await fetch(`/admin/users/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadUsers();
        }
    });

    // =====================================================
    // SETTINGS - RATES
    // =====================================================

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
        `;

        if (!data.length) {
            html += `
                <tr>
                    <td><input id="rateFrom"></td>
                    <td><input id="rateTo"></td>
                    <td><input id="rateValue"></td>
                    <td><button onclick="createRate()">Save</button></td>
                </tr>
            `;
        } else {
            data.forEach(r => {
                html += `
                    <tr>
                        <td>${r.fromCurrency}</td>
                        <td>${r.toCurrency}</td>
                        <td>${r.rate}</td>
                        <td></td>
                    </tr>
                `;
            });
        }

        wrapper.innerHTML = html + "</tbody></table>";
    }

    // =====================================================
    // SETTINGS - CURRENCIES
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
        `;

        if (!data.length) {
            html += `
                <tr>
                    <td><input id="curCountry"></td>
                    <td><input id="curCode"></td>
                    <td><input id="curName"></td>
                    <td><button onclick="createCurrency()">Save</button></td>
                </tr>
            `;
        } else {
            data.forEach(c => {
                html += `
                    <tr>
                        <td>${c.country}</td>
                        <td>${c.code}</td>
                        <td>${c.name}</td>
                        <td></td>
                    </tr>
                `;
            });
        }

        wrapper.innerHTML = html + "</tbody></table>";
    }

    // =====================================================
    // SETTINGS - EXPENSE TYPES
    // =====================================================

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
        `;

        if (!data.length) {
            html += `
                <tr>
                    <td><input id="expName"></td>
                    <td><button onclick="createExpenseType()">Save</button></td>
                </tr>
            `;
        } else {
            data.forEach(t => {
                html += `
                    <tr>
                        <td>${t.name}</td>
                        <td></td>
                    </tr>
                `;
            });
        }

        wrapper.innerHTML = html + "</tbody></table>";
    }

    // =====================================================
    // CREATE FUNCTIONS
    // =====================================================

    window.createRate = async function () {
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
    };

    window.createCurrency = async function () {
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
    };

    window.createExpenseType = async function () {
        await fetch("/admin/expense-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                name: expName.value
            })
        });

        loadExpenseTypes();
    };

    // ================= LOGOUT =================
    logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
    });

});