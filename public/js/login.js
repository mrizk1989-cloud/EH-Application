document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // ================= SWITCH TABS =================
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

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

    // ================= EYE TOGGLE =================
    document.addEventListener("click", (e) => {

        if (!e.target.classList.contains("toggle-eye")) return;

        const id = e.target.dataset.target;
        const input = document.getElementById(id);

        if (!input) return;

        input.type = input.type === "password" ? "text" : "password";
        e.target.textContent = input.type === "password" ? "👁" : "🙈";
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
                console.log(data);

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
                console.log(data);

                if (data.success) {
                    window.location.href = "/user";
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