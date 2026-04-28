const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

document.getElementById("loginBtn").onclick = () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
};

document.getElementById("registerBtn").onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
};

// LOGIN
loginForm.onsubmit = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(loginForm));

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();

    const msg = document.getElementById("msg");
    msg.innerText = result.message;
    msg.style.color = result.success ? "green" : "red";
};

// REGISTER
registerForm.onsubmit = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(registerForm));

    const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();

    const msg = document.getElementById("msg2");
    msg.innerText = result.message;
    msg.style.color = result.success ? "green" : "red";
};