document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    // ================= SWITCH TABS =================
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

    // ================= 👁 PASSWORD TOGGLE (FIXED) =================
    document.addEventListener("click", (e) => {

        const target = e.target;

        if (!target.classList.contains("toggle-eye")) return;

        const inputId = target.dataset.target;
        const input = document.getElementById(inputId);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            target.textContent = "🙈";
        } else {
            input.type = "password";
            target.textContent = "👁";
        }
    });

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