document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

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
                    // clear local CSRF token too (cleanup)
                    localStorage.removeItem("csrf_token");

                    window.location.href = "/";
                } else {
                    alert(data.message || "Logout failed");
                }

            } catch (err) {
                console.error("LOGOUT ERROR:", err);
                alert("Failed to logout");
            }
        });
    }

});