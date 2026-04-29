document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.getElementById("tableBody");
    const addRowBtn = document.getElementById("addRowBtn");
    const deleteRowsBtn = document.getElementById("deleteRowsBtn");
    const requestForm = document.getElementById("requestForm");

    // ================= ADD ROW =================
    if (addRowBtn) {
        addRowBtn.addEventListener("click", () => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td><input type="checkbox" class="row-check"></td>

                <td><input type="text" name="customerId[]" required></td>

                <td>
                    <input type="text" name="amount[]" 
                        class="amount-input" 
                        inputmode="decimal" 
                        pattern="^\\d+(\\.\\d{1,2})?$"
                        required
                    >
                </td>

                <td>
                    <select name="currency[]">
                        <option value="USD">USD</option>
                        <option value="SAR">SAR</option>
                        <option value="EUR">EUR</option>
                    </select>
                </td>

                <td>
                    <select name="expenseType[]">
                        <option value="medical">Medical</option>
                        <option value="travel">Travel</option>
                        <option value="other">Other</option>
                    </select>
                </td>

                <td><input type="text" name="purpose[]"></td>
                <td><input type="text" name="doctor[]"></td>

                <td>
                    <select name="month[]">
                        ${Array.from({ length: 12 }, (_, i) =>
                `<option value="${i + 1}">${i + 1}</option>`
            ).join('')}
                    </select>
                </td>

                <td>
                    <select name="year[]">
                        ${Array.from({ length: 11 }, (_, i) =>
                `<option value="${2020 + i}">${2020 + i}</option>`
            ).join('')}
                    </select>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    // ================= DELETE ROWS =================
    if (deleteRowsBtn) {
        deleteRowsBtn.addEventListener("click", () => {

            document.querySelectorAll(".row-check").forEach(cb => {
                if (cb.checked) {
                    cb.closest("tr").remove();
                }
            });
        });
    }

    // ================= AMOUNT INPUT FIX =================
    document.addEventListener("input", (e) => {

        if (!e.target.classList.contains("amount-input")) return;

        let value = e.target.value;

        value = value.replace(/[^0-9.]/g, '');

        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        e.target.value = value;
    });

    // ================= SUBMIT (SECURE VERSION) =================
    if (requestForm) {
        requestForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const rows = document.querySelectorAll("#tableBody tr");

            let items = [];

            rows.forEach(row => {
                const inputs = row.querySelectorAll("input, select");

                items.push({
                    customerId: inputs[1].value,
                    amount: parseFloat(inputs[2].value),
                    currency: inputs[3].value,
                    expenseType: inputs[4].value,
                    purpose: inputs[5].value,
                    doctorName: inputs[6].value,
                    requestPeriodMonth: parseInt(inputs[7].value),
                    requestPeriodYear: parseInt(inputs[8].value)
                });
            });

            try {
                const res = await fetch("/api/requests", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "x-csrf-token": localStorage.getItem("csrf_token")
                    },
                    body: JSON.stringify({ items })
                });

                const data = await res.json();

                if (data.success) {
                    alert("Request submitted successfully");
                    console.log("Saved Request:", data);
                } else {
                    alert(data.message || "Failed to submit request");
                }

            } catch (err) {
                console.error("SUBMIT ERROR:", err);
                alert("Server error while submitting request");
            }
        });
    }

});