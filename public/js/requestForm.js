document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.getElementById("tableBody");
    const addRowBtn = document.getElementById("addRowBtn");
    const deleteRowsBtn = document.getElementById("deleteRowsBtn");
    const requestForm = document.getElementById("requestForm");

    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    let currencyOptions = [];
    let expenseTypes = [];

    // ================= BACK =================
    backBtn?.addEventListener("click", () => {
        window.location.href = "/user";
    });

    // ================= LOGOUT =================
    logoutBtn?.addEventListener("click", async () => {
        const res = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await res.json();

        if (data.success) {
            window.location.href = "/";
        } else {
            alert("Logout failed");
        }
    });

    // ================= LOAD CURRENCIES =================
    async function loadCurrencies() {
        const res = await fetch("/api/currencies", { credentials: "include" });
        const data = await res.json();

        currencyOptions = data.success ? data.currencies : [];
    }

    // ================= LOAD EXPENSE TYPES =================
    async function loadExpenseTypes() {
        const res = await fetch("/api/expense-types", { credentials: "include" });
        const data = await res.json();

        expenseTypes = data.success ? data.data : [];
    }

    // ================= BUILD CURRENCY =================
    function buildCurrencySelect() {
        return `
            <select name="currency[]">
                ${currencyOptions.map(c =>
            `<option value="${c.code}">${c.code}</option>`
        ).join("")}
            </select>
        `;
    }

    // ================= BUILD EXPENSE TYPE =================
    // function normalizeExpenseType(name) {

    //     const map = {
    //         "medical": "medical",
    //         "medical expenses": "medical",
    //         "travel": "travel",
    //         "travel request": "travel",
    //         "other": "other"
    //     };

    //     const key = name.toLowerCase().trim();

    //     return map[key] || "other";
    // }

    function buildExpenseSelect() {
        return `
        <select name="expenseType[]">
            ${expenseTypes.map(e =>
            `<option value="${e.name}">${e.name}</option>`
        ).join("")}
        </select>
    `;
    }



    // ================= ADD ROW =================
    function addRow() {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="checkbox" class="row-check"></td>

            <td><input type="text" name="customerId[]" required></td>

            <td><input type="number" name="amount[]" step="0.01" min="0" required></td>

            <td>${buildCurrencySelect()}</td>

            <td>${buildExpenseSelect()}</td>

            <td><input type="text" name="purpose[]"></td>
            <td><input type="text" name="doctor[]"></td>

            <td>
                <select name="month[]">
                    ${Array.from({ length: 12 }, (_, i) =>
            `<option value="${i + 1}">${i + 1}</option>`
        ).join("")}
                </select>
            </td>

            <td>
                <select name="year[]">
                    ${Array.from({ length: 11 }, (_, i) =>
            `<option value="${2020 + i}">${2020 + i}</option>`
        ).join("")}
                </select>
            </td>
        `;

        tableBody.appendChild(row);
    }

    // ================= BUILD PAYLOAD =================
    function buildPayload() {

        const rows = document.querySelectorAll("#tableBody tr");

        const items = [];

        rows.forEach(row => {

            const customerId = row.querySelector("[name='customerId[]']")?.value;
            const amount = row.querySelector("[name='amount[]']")?.value;

            if (!customerId || !amount) return;

            items.push({
                customerId,
                amount: Number(amount),
                currency: row.querySelector("[name='currency[]']")?.value,
                expenseType: row.querySelector("[name='expenseType[]']")?.value?.trim(),
                purpose: row.querySelector("[name='purpose[]']")?.value,
                doctorName: row.querySelector("[name='doctor[]']")?.value,
                requestPeriodMonth: Number(row.querySelector("[name='month[]']")?.value),
                requestPeriodYear: Number(row.querySelector("[name='year[]']")?.value)
            });
        });

        return { items };
    }

    // ================= INIT =================
    (async function init() {
        await loadCurrencies();
        await loadExpenseTypes();

        // IMPORTANT: remove static row problem
        tableBody.innerHTML = "";
        addRow();
    })();

    addRowBtn?.addEventListener("click", addRow);

    deleteRowsBtn?.addEventListener("click", () => {
        document.querySelectorAll(".row-check").forEach(cb => {
            if (cb.checked) cb.closest("tr").remove();
        });
    });

    requestForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = buildPayload();
        console.log("SUBMIT PAYLOAD:", payload);

        const res = await fetch("/api/request/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        console.log("SERVER RESPONSE:", data); // 🔥 ADD THIS

        if (!data.success && data.errors) {
            console.table(data.errors); // 🔥 SHOW EXACT VALIDATION FAILURES
        }

        alert(data.message);

        if (data.success) location.reload();
    });

});