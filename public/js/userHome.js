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
            const res = await fetch("/api/request/my", { credentials: "include" });
            const data = await res.json();

            if (!data.success) {
                wrapper.innerHTML = "<p>Failed to load requests</p>";
                return;
            }

            if (data.requests.length === 0) {
                wrapper.innerHTML = "<p>No requests yet</p>";
                return;
            }

            let html = `
            <table>
                <thead>
                    <tr>
                        <th>Request No</th>
                        <th>Total (SAR)</th>
                        <th>Status</th>
                        <th>Items</th>
                    </tr>
                </thead>
                <tbody>
            `;

            data.requests.forEach(r => {
                html += `
                <tr>
                    <td>${r.requestNo}</td>
                    <td>${r.totalAmountSAR}</td>
                    <td>${r.status}</td>
                    <td>${r.items.length}</td>
                </tr>
                `;
            });

            wrapper.innerHTML = html + "</tbody></table>";

        } catch (err) {
            console.error(err);
            wrapper.innerHTML = "<p>Error loading data</p>";
        }
    }

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