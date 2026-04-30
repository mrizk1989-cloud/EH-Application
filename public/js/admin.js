document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".nav-links button[data-section]");
    const logoutBtn = document.getElementById("logoutBtn");

    const dropdown = document.getElementById("settingsDropdown");
    const dropdownBtn = document.getElementById("dropdownBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");

    const wrapper = document.getElementById("settingsTableWrapper");
    const title = document.getElementById("settingsTitle");

    document.addEventListener("click", async (e) => {

        // EDIT
        if (e.target.classList.contains("edit-btn")) {
            const id = e.target.dataset.id;
            alert("Edit user: " + id);
        }

        // DELETE
        if (e.target.classList.contains("delete-btn")) {
            const id = e.target.dataset.id;
            const confirmDelete = confirm("Are you sure you want to delete this user?");
            if (!confirmDelete) return;
            await fetch(`/admin/users/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadUsers();
        }
    });

    // ================= NAV =================
    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {

            const section = btn.dataset.section;

            document.querySelectorAll(".section")
                .forEach(s => s.classList.remove("active"));

            document.getElementById(section + "Section")
                .classList.add("active");

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
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });

    // ================= SETTINGS MENU =================
    dropdownMenu.addEventListener("click", async (e) => {

        const item = e.target.closest(".dropdown-item");
        if (!item) return;

        const value = item.dataset.value;

        document.querySelectorAll(".section")
            .forEach(s => s.classList.remove("active"));

        document.getElementById("settingsSection")
            .classList.add("active");

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

    // ================= USERS =================
    async function loadUsers() {
        const res = await fetch("/admin/users", { credentials: "include" });
        const data = await res.json();

        const body = document.getElementById("usersTableBody");
        body.innerHTML = "";

        data.forEach(u => {
            body.innerHTML += `
                <tr>
                    <td>${u.user_name}</td>
                    <td>${u.user_email}</td>
                    <td>${u.user_type}</td>
                    <td>${(u.roles || []).join(", ")}</td>
                    <td>
                        <button class="edit-btn" data-id="${u._id}">Edit</button>
                        <button class="delete-btn" data-id="${u._id}">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    // ================= REQUESTS =================
    async function loadRequests() {
        const res = await fetch("/admin/requests", { credentials: "include" });
        const data = await res.json();

        const body = document.getElementById("requestsTableBody");
        body.innerHTML = "";

        data.forEach(r => {
            body.innerHTML += `
                <tr>
                    <td>${r._id}</td>
                    <td>${r.customerId}</td>
                    <td>${r.amount}</td>
                    <td>${r.currency}</td>
                </tr>
            `;
        });
    }

    // ================= RATES =================
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

    // ================= CURRENCIES =================
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

    // ================= EXPENSE TYPES =================
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

    // ================= CREATE =================
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

    // ================= USER ACTIONS =================
    window.deleteUser = async function (id) {
        await fetch(`/admin/users/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        loadUsers();
    };

    window.editUser = function (id) {
        alert("Edit user: " + id);
    };

    // ================= LOGOUT =================
    logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
    });

});