document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    // ================= SWITCH =================
    if (loginBtn && registerBtn && loginForm && registerForm) {

        loginBtn.onclick = () => {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
        };

        registerBtn.onclick = () => {
            loginForm.style.display = "none";
            registerForm.style.display = "block";
        };
    }

    // ================= REGISTER =================
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = registerForm.querySelector("input[name='fullName']").value;
            const email = registerForm.querySelector("input[name='email']").value;
            const password = registerForm.querySelector("input[name='password']").value;

            const msg = document.getElementById("msg2");

            try {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName, email, password })
                });

                const data = await res.json();

                if (data.success && data.csrfToken) {
                    localStorage.setItem("csrf_token", data.csrfToken);
                }

                msg.innerText = data.message;
                msg.style.color = data.success ? "green" : "red";

            } catch (err) {
                msg.innerText = "Server error";
                msg.style.color = "red";
            }
        });
    }

    // ================= LOGIN =================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = loginForm.querySelector("input[name='email']").value;
            const password = loginForm.querySelector("input[name='password']").value;

            const msg = document.getElementById("msg");

            try {
                const res = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.success) {

                    // ✅ STORE CSRF TOKEN
                    if (data.csrfToken) {
                        localStorage.setItem("csrf_token", data.csrfToken);
                    }

                    const roles = data.roles || [];

                    if (roles.includes("admin")) {
                        window.location.href = "/admin";
                    } else {
                        window.location.href = "/user";
                    }

                } else {
                    msg.innerText = data.message;
                    msg.style.color = "red";
                }

            } catch (err) {
                msg.innerText = "Server error";
                msg.style.color = "red";
            }
        });
    }

});