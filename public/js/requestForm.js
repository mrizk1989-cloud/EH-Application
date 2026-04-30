document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.getElementById("tableBody");

    const addRowBtn = document.getElementById("addRowBtn");
    const deleteRowsBtn = document.getElementById("deleteRowsBtn");

    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

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
                        "x-csrf-token": localStorage.getItem("csrf_token")
                    }
                });

                const data = await res.json();

                if (data.success) {
                    localStorage.removeItem("csrf_token");
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
    if (addRowBtn) {
        addRowBtn.addEventListener("click", () => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td><input type="checkbox" class="row-check"></td>
                <td><input type="text" name="customerId[]" required></td>

                <td>
                    <input type="text" name="amount[]" class="amount-input"
                    inputmode="decimal"
                    pattern="^[0-9]+(\\.[0-9]{1,2})?$" required>
                </td>

                <td>
                    <select name="currency[]">
                        <option>USD</option>
                        <option>SAR</option>
                        <option>EUR</option>
                    </select>
                </td>

                <td>
                    <select name="expenseType[]">
                        <option>Medical</option>
                        <option>Travel</option>
                        <option>Other</option>
                    </select>
                </td>

                <td><input type="text" name="purpose[]"></td>
                <td><input type="text" name="doctor[]"></td>

                <td>
                    <select name="month[]">
                        ${Array.from({ length: 12 }, (_, i) => `<option>${i + 1}</option>`).join("")}
                    </select>
                </td>

                <td>
                    <select name="year[]">
                        ${Array.from({ length: 11 }, (_, i) => `<option>${2020 + i}</option>`).join("")}
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
                if (cb.checked) cb.closest("tr").remove();
            });
        });
    }

    // ================= AMOUNT FIX =================
    document.addEventListener("input", (e) => {
        if (e.target.classList.contains("amount-input")) {
            e.target.value = e.target.value.replace(/[^0-9.]/g, "");
        }
    });

});