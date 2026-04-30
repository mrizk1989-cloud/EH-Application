document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {

            try {
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

            } catch (err) {
                console.error(err);
                alert("Logout error");
            }
        });
    }

});