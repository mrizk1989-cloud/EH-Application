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

    const tableBody = document.getElementById("tableBody");
    const addRowBtn = document.getElementById("addRowBtn");
    const deleteRowsBtn = document.getElementById("deleteRowsBtn");
    const requestForm = document.getElementById("requestForm");
    const User = require('../models/User');
    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

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

});



let currencyOptions = [];
let expenseTypes = [];
let customers = [];

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

// ================= LOAD CUSTOMERS =================
async function loadCustomers() {

    const res = await fetch("/api/request/customers", {
        credentials: "include"
    });

    const data = await res.json();

    customers = data.success ? data.data : [];

    console.log("CUSTOMERS:", customers);
}

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

// ================= BUILD CUSTOMERS =================
function buildCustomerDatalist() {

    return `
        <datalist id="customersList">

            ${customers.map(c => `
                <option 
                    value="${c.customer_number}">
                    ${c.customer_number} - ${c.cutomer_name}
                </option>
            `).join("")}

        </datalist>
    `;
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
            <td>
                <input 
                    type="text"
                    name="customerId[]"
                    class="customer-id-input"
                    list="customersList"
                    placeholder="Customer ID"
                    required>
            </td>

            <td>
                <input 
                    type="text"
                    name="customerName[]"
                    readonly>
            </td>
            <td>
                <input 
                    type="text"
                    name="salesTerritory[]"
                    readonly>
            </td>
            <td>
            <input 
                type="text"
                name="salesCountry[]"
                readonly>
            </td>
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
            <td>
                <input class="UploadFile" type="file" name="file[]">
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
    await loadCustomers();

    document.body.insertAdjacentHTML(
        "beforeend",
        buildCustomerDatalist()
    );

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

    const formData = new FormData();

    const rows = document.querySelectorAll("#tableBody tr");

    const items = [];

    rows.forEach((row, index) => {

        const fileInput = row.querySelector("[name='file[]']");
        const file = fileInput?.files[0];


        const item = {
            customerId: row.querySelector("[name='customerId[]']").value,
            customerName: row.querySelector("[name='customerName[]']").value,
            salesTerritory: row.querySelector("[name='salesTerritory[]']").value,
            salesCountry: row.querySelector("[name='salesCountry[]']").value,
            amount: Number(row.querySelector("[name='amount[]']").value),
            currency: row.querySelector("[name='currency[]']").value,
            expenseType: row.querySelector("[name='expenseType[]']").value,
            purpose: row.querySelector("[name='purpose[]']").value,
            doctorName: row.querySelector("[name='doctor[]']").value,
            requestPeriodMonth: Number(row.querySelector("[name='month[]']").value),
            requestPeriodYear: Number(row.querySelector("[name='year[]']").value)
        };

        items.push(item);

        if (file) {
            formData.append("files", file);
        }
    });

    formData.append("items", JSON.stringify(items));

    const res = await fetch("/api/request/submit", {
        method: "POST",
        credentials: "include",
        body: formData
    });

    const data = await res.json();

    alert(data.message);



    if (data.success) {

        const emails = data.emails;

        const subject = encodeURIComponent(
            `New Request ${data.requestNo}`
        );

        const body = encodeURIComponent(
            `A new request has been submitted.

                Request No: ${data.requestNo}
                Total Amount (SAR): ${data.totalAmountSAR}
               

                This is an automated notification.`
        );

        const mailtoLink =
            `mailto:${emails.to}?cc=${emails.cc}&subject=${subject}&body=${body}`;

        window.location.href = mailtoLink;

        location.reload();
    }
});

document.addEventListener("input", (e) => {

    if (!e.target.classList.contains("customer-id-input")) return;

    const customerId = e.target.value;

    const customer = customers.find(c =>
        c.customer_number === customerId
    );

    const row = e.target.closest("tr");

    row.querySelector("[name='customerName[]']").value =
        customer?.cutomer_name || "";

    row.querySelector("[name='salesTerritory[]']").value =
        customer?.area || "";

    row.querySelector("[name='salesCountry[]']").value =
        customer?.country || "";
});



