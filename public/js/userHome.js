document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");
    const newRequestBtn = document.getElementById("newRequestBtn");
    const userNameEl = document.getElementById("userName");
    const wrapper = document.getElementById("requestsWrapper");

    // ================= LOAD USER INFO =================
    async function loadUser() {
        try {
            const res = await fetch("/api/me", { credentials: "include" });
            const data = await res.json();

            if (data.success) {
                userNameEl.innerText = data.user.userName;
            }
        } catch (err) {
            console.error(err);
        }
    }

    // ================= LOAD REQUESTS =================
    async function loadRequests() {
        try {
            const res = await fetch("/api/request/my-detailed", {
                credentials: "include"
            });

            const json = await res.json();
            const data = json.data;

            if (!Array.isArray(data)) {
                wrapper.innerHTML = "<p>Error loading</p>";
                return;
            }

            let html = `
        <table>
            <thead>
                <tr>
                    <th>Request No</th>
                    <th>Total (SAR)</th>
                    <th>Status</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
        `;

            data.forEach(r => {
                html += `
            <tr data-id="${r._id}">
                <td>${r.requestNo}</td>
                <td>${r.totalAmountSAR}</td>
                <td>${r.status}</td>
                <td><button class="view-request">View</button></td>
            </tr>
            `;
            });

            html += `</tbody></table>`;
            wrapper.innerHTML = html;

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }

    document.addEventListener("click", async (e) => {

        if (!e.target.classList.contains("view-request")) return;

        const parentRow = e.target.closest("tr");
        const requestId = parentRow.dataset.id;

        // toggle close
        if (parentRow.nextElementSibling?.classList.contains("sub-table-row")) {
            parentRow.nextElementSibling.remove();
            return;
        }

        // close others
        document.querySelectorAll(".sub-table-row").forEach(el => el.remove());

        const res = await fetch(`/api/request/my/${requestId}/items`, {
            credentials: "include"
        });

        const items = await res.json(); // ✅ correct

        // const items = await res.json({
        //     success: true,
        //     items
        // });

        if (!Array.isArray(items) || items.length === 0) return;

        const subRow = document.createElement("tr");
        subRow.classList.add("sub-table-row");

        subRow.innerHTML = `
        <td colspan="4">
            <table class="sub-table">
                <thead>
                    <tr>
                        <th>Sub No</th>
                        <th>Customer ID</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Expense</th>
                        <th>Purpose</th>
                        <th>Doctor</th>
                        <th>Month</th>
                        <th>Year</th>
                        <th>Rate</th>
                        <th>SAR</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.subRequestNo}</td>
                            <td>${item.customerId}</td>
                            <td>${item.amount}</td>
                            <td>${item.currency}</td>
                            <td>${item.expenseType}</td>
                            <td>${item.purpose}</td>
                            <td>${item.doctorName}</td>
                            <td>${item.requestPeriodMonth}</td>
                            <td>${item.requestPeriodYear}</td>
                            <td>${item.exchangeRate}</td>
                            <td>${item.amountSAR}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </td>
    `;

        parentRow.insertAdjacentElement("afterend", subRow);
    });

    // ================= NAVIGATION =================
    newRequestBtn.addEventListener("click", () => {
        window.location.href = "/request-form";
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

    // ================= INIT =================
    loadUser();
    loadRequests();

});