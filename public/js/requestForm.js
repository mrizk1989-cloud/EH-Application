document.addEventListener("DOMContentLoaded", () => {

    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const addRowBtn = document.getElementById("addRowBtn");
    const deleteRowsBtn = document.getElementById("deleteRowsBtn");
    const tableBody = document.getElementById("tableBody");
    const requestForm = document.getElementById("requestForm");

    // ================= BACK =================
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "/user";
        });
    }

    // ================= LOGOUT =================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {

            try {
                const res = await fetch("/api/logout", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                const data = await res.json();

                if (data.success) {
                    window.location.href = "/";
                } else {
                    alert(data.message || "Logout failed");
                }

            } catch (err) {
                console.error(err);
                alert("Logout error");
            }
        });
    }

    // ================= ADD ROW =================
    if (addRowBtn && tableBody) {
        addRowBtn.addEventListener("click", () => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td><input type="checkbox" class="row-check"></td>

                <td><input type="text" name="customerId[]" required></td>

                <td>
                    <input
                        type="number"
                        name="amount[]"
                        class="amount-input"
                        step="0.01"
                        min="0"
                        inputmode="decimal"
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
        });
    }

    // ================= DELETE ROWS =================
    if (deleteRowsBtn && tableBody) {
        deleteRowsBtn.addEventListener("click", () => {

            const checkboxes = document.querySelectorAll(".row-check");

            checkboxes.forEach(cb => {
                if (cb.checked) {
                    cb.closest("tr").remove();
                }
            });
        });
    }

});