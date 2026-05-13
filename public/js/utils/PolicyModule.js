const PolicyModule = (() => {

    async function uploadPolicy(formData) {

        const res = await fetch("/api/policies/upload", {
            method: "POST",
            credentials: "include",
            body: formData
        });

        return await res.json();
    }

    function render(containerId) {

        const container = document.getElementById(containerId);

        if (!container) return;

        container.innerHTML = `

            <div class="policy-box">

                <input
                    type="text"
                    id="policyName"
                    placeholder="Policy Name">

                <input
                    type="date"
                    id="effectiveDate">

                <input
                    type="file"
                    id="policyFile"
                    accept=".pdf">

                <button id="uploadPolicyBtn">
                    Upload Policy
                </button>

            </div>
        `;

        const btn = container.querySelector("#uploadPolicyBtn");

        btn.addEventListener("click", async () => {

            const policyName =
                container.querySelector("#policyName").value.trim();

            const effectiveDate =
                container.querySelector("#effectiveDate").value;

            const file =
                container.querySelector("#policyFile").files[0];

            if (!policyName) {
                return alert("Policy name required");
            }

            if (!file) {
                return alert("PDF required");
            }

            const formData = new FormData();

            formData.append("policyName", policyName);

            formData.append("effectiveDate", effectiveDate);

            formData.append("files", file);

            const data = await uploadPolicy(formData);

            alert(data.message);

            if (data.success) {
                location.reload();
            }
        });
    }

    return { render };

})();

export default PolicyModule;