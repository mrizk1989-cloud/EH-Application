document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".nav-links button[data-section]");
    const logoutBtn = document.getElementById("logoutBtn");

    const usersTableBody = document.getElementById("usersTableBody");

    let usersLoaded = false;

    // ================= NAVIGATION =================
    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {

            const section = btn.dataset.section;

            // hide all sections
            document.querySelectorAll(".section")
                .forEach(sec => sec.classList.remove("active"));

            // show selected section
            document.getElementById(section + "Section")
                .classList.add("active");

            // hide welcome once navigation starts
            document.getElementById("welcomeSection")
                .classList.remove("active");

            // ================= LOAD USERS ONLY ON FIRST CLICK =================
            if (section === "users" && !usersLoaded) {
                await loadUsers();
                usersLoaded = true;
            }
        });
    });

    // ================= LOAD USERS =================
    async function loadUsers() {

        try {
            const res = await fetch("/admin/users", {
                credentials: "include"
            });

            const users = await res.json();

            usersTableBody.innerHTML = "";

            users.forEach(user => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${user.user_name || ""}</td>
                    <td>${user.user_email || ""}</td>
                    <td>${user.user_type || ""}</td>
                    <td>${(user.roles || []).join(", ")}</td>
                    <td>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;

                usersTableBody.appendChild(row);
            });

        } catch (err) {
            console.error("LOAD USERS ERROR:", err);
        }
    }

    // ================= LOGOUT =================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {

            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            window.location.href = "/";
        });
    }

});