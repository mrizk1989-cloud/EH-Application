
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
        body.innerHTML = "";

        data.forEach(u => {
            body.innerHTML += `
                <tr data-id="${u._id}">
                    <td class="name">${u.user_name}</td>
                    <td class="email">${u.user_email}</td>
                    <td class="type">${u.user_type}</td>
                    <td class="roles">${(u.roles || []).join(", ")}</td>
                    <td>
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

            const data = await res.json();

            

            const body = document.getElementById("requestsTableBody");

            if (!body) {
                console.error("requestsTableBody not found in HTML");
                return;
            }

            body.innerHTML = "";

            data.forEach(r => {

                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                <tr data-id="${r._id}">
                <td class="requestNo">${r.requestNo || ""}</td>
                <td class="userName">${r.userName || ""}</td>
                <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                <td class="status">${r.status || "pending"}</td>
                <td><button class="view-request">View</button></td>
                <td>
                    
                    <button class="edit-request">Edit</button>
                    <button class="delete-request">Delete</button>
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
            <td><button data-action="create-currency">Create</button></td>
        </tr>
        `;

        data.forEach(c => {
            html += `
                <tr data-id="${c._id}">
                    <td class="country">${c.country}</td>
                    <td class="code">${c.code}</td>
                    <td class="name">${c.name || ""}</td>
                    <td>
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
            <td><button data-action="create-rate">Create</button></td>
        </tr>
        `;

        data.forEach(r => {
            html += `
                <tr data-id="${r._id}">
                    <td class="from">${r.fromCurrency}</td>
                    <td class="to">${r.toCurrency}</td>
                    <td class="rate">${r.rate}</td>
                    <td>
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
            <td><button data-action="create-expense">Create</button></td>
        </tr>
        `;

        data.forEach(t => {
            html += `
                <tr data-id="${t._id}">
                    <td class="name">${t.name}</td>
                    <td>
                        <button class="edit-expense">Edit</button>
                        <button class="delete-expense">Delete</button>
                    </td>
                </tr>
            `;
        });

        wrapper.innerHTML = html + "</tbody></table>";
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
            <td>
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

            await fetch(`/admin/users/${row.dataset.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    user_name: row.children[0].children[0].value,
                    user_email: row.children[1].children[0].value,
                    user_type: row.children[2].children[0].value,
                    roles: row.children[3].children[0].value.split(",")
                })
            });

            loadUsers();
        }

        if (e.target.classList.contains("delete-user")) {

            if (!confirm("Delete user?")) return;

            await fetch(`/admin/users/${row.dataset.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            loadUsers();
        }

        if (e.target.classList.contains("edit-request")) {

            row.dataset.original = row.innerHTML;

            row.innerHTML = `
            <td><input value="${row.querySelector(".requestNo").innerText}"></td>
            <td><input value="${row.querySelector(".userName").innerText}"></td>
            <td><input value="${row.querySelector(".totalAmountSAR").innerText}"></td>
            <td><input value="${row.querySelector(".status").innerText}"></td>
            <td>
                <button class="save-request">Save</button>
                <button class="cancel-request">Cancel</button>
            </td>
        `;
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

            const res = await fetch(`/admin/requests/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) {
                console.error("DELETE failed");
                return;
            }

            loadRequests();
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

            const data = await res.json();

            

            const body = document.getElementById("requestsTableBody");

            if (!body) {
                console.error("requestsTableBody not found in HTML");
                return;
            }

            body.innerHTML = "";

            data.forEach(r => {

                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                <td class="requestNo">${r.requestNo || ""}</td>
                <td class="userName">${r.userName || ""}</td>
                <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                <td class="status">${r.status || "pending"}</td>
                <td><button class="view-request">View</button></td>
                <td>
                    
                    <button class="edit-request">Edit</button>
                    <button class="delete-request">Delete</button>
                </td>
            `;

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
                    <td>
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

            const data = await res.json();

            

            const body = document.getElementById("requestsTableBody");

            if (!body) {
                console.error("requestsTableBody not found in HTML");
                return;
            }

            body.innerHTML = "";

            data.forEach(r => {

                const tr = document.createElement("tr");
                tr.dataset.id = r._id;

                tr.innerHTML = `
                <td class="requestNo">${r.requestNo || ""}</td>
                <td class="userName">${r.userName || ""}</td>
                <td class="totalAmountSAR">${r.totalAmountSAR || 0}</td>
                <td class="status">${r.status || "pending"}</td>
                <td><button class="view-request">View</button></td>
                <td>
                    
                    <button class="edit-request">Edit</button>
                    <button class="delete-request">Delete</button>
                </td>
            `;

                body.appendChild(tr);
            });

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
            <td><button data-action="create-currency">Create</button></td>
        </tr>
        `;

        data.forEach(c => {
            html += `
                <tr data-id="${c._id}">
                    <td class="country">${c.country}</td>
                    <td class="code">${c.code}</td>
                    <td class="name">${c.name || ""}</td>
                    <td>
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
            <td><button data-action="create-rate">Create</button></td>
        </tr>
        `;

        data.forEach(r => {
            html += `
                <tr data-id="${r._id}">
                    <td class="from">${r.fromCurrency}</td>
                    <td class="to">${r.toCurrency}</td>
                    <td class="rate">${r.rate}</td>
                    <td>
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
            <td><button data-action="create-expense">Create</button></td>
        </tr>
        `;

        data.forEach(t => {
            html += `
                <tr data-id="${t._id}">
                    <td class="name">${t.name}</td>
                    <td>
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