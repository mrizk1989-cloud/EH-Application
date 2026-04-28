document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // ================= SWITCH TABS =================
    document.getElementById("loginBtn").onclick = () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    };

    document.getElementById("registerBtn").onclick = () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    };

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
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("REGISTER SUBMIT TRIGGERED");

        const fullName = registerForm.querySelector("input[name='fullName']").value;
        const email = registerForm.querySelector("input[name='email']").value;
        const password = registerForm.querySelector("input[name='password']").value;

        const msg = document.getElementById("msg2");

        if (!fullName || !email || !password) {
            msg.innerText = "All fields are required";
            msg.style.color = "red";
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await res.json();

            console.log(data); // ✅ DEBUG

            msg.innerText = data.message;
            msg.style.color = data.success ? "green" : "red";

        } catch (err) {
            msg.innerText = "Server error";
            msg.style.color = "red";
        }
    });

    // ================= LOGIN (FIX ADDED) =================
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("LOGIN SUBMIT TRIGGERED");

        const email = loginForm.querySelector("input[name='email']").value;
        const password = loginForm.querySelector("input[name='password']").value;

        const msg = document.getElementById("msg");

        if (!email || !password) {
            msg.innerText = "Email and password required";
            msg.style.color = "red";
            return;
        }

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            console.log(data); // ✅ DEBUG (IMPORTANT)

            msg.innerText = data.message;
            msg.style.color = data.success ? "green" : "red";

        } catch (err) {
            console.error(err);
            msg.innerText = "Server error";
            msg.style.color = "red";
        }
    });

});