const PolicyModule = (() => {

    let editingId = null;

    // ================= LOAD POLICIES =================
    async function loadPolicies() {

        const res = await fetch("/api/policies", {
            credentials: "include"
        });

        return await res.json();
    }

    // ================= CREATE / UPDATE =================
    async function uploadPolicy(formData, isEdit = false, id = null) {

        const url = isEdit
            ? `/api/policies/update/${id}`
            : "/api/policies/upload";

        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        return await res.json();
    }

    // ================= DELETE =================
    async function deletePolicy(id) {

        const res = await fetch(`/api/policies/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        return await res.json();
    }

    // ================= RENDER MODULE =================
    function render(containerId) {

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `

            <div class="policy-module">

                <!-- FORM -->
                <div class="policy-box">

                    <input type="text" id="policyName" placeholder="Policy Name">

                    <input type="date" id="effectiveDate">

                    <input type="file" id="policyFile" accept=".pdf">

                    <button id="savePolicyBtn">
                        Save Policy
                    </button>

                </div>

                <!-- TABLE -->
                <div id="policyTable"></div>

            </div>
        `;

        loadAndRender();

        // ================= SAVE BUTTON =================
        container.querySelector("#savePolicyBtn")
            .addEventListener("click", async () => {

                const name =
                    container.querySelector("#policyName").value.trim();

                const date =
                    container.querySelector("#effectiveDate").value;

                const fileInput =
                    container.querySelector("#policyFile");

                const file = fileInput.files[0];

                if (!name) {
                    return alert("Policy name required");
                }

                if (!isEditMode() && !file) {
                    return alert("PDF file required");
                }

                const formData = new FormData();

                formData.append("policyName", name);
                formData.append("effectiveDate", date);

                // ================= IMPORTANT FIX =================
                if (file) {

                    if (editingId) {
                        formData.append("file", file);   // UPDATE
                    } else {
                        formData.append("files", file);  // CREATE
                    }
                }

                const data = await uploadPolicy(
                    formData,
                    !!editingId,
                    editingId
                );

                alert(data.message);

                if (data.success) {

                    editingId = null;

                    container.querySelector("#policyName").value = "";
                    container.querySelector("#effectiveDate").value = "";
                    fileInput.value = "";

                    loadAndRender();
                }
            });
    }

    // ================= LOAD + TABLE =================
    async function loadAndRender() {

        const container = document.getElementById("policyTable");
        if (!container) return;

        const data = await loadPolicies();

        if (!data.success) {
            container.innerHTML = "<p>Failed to load policies</p>";
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Policy Name</th>
                        <th>Effective Date</th>
                        <th>File</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    ${data.data.map(p => `

                        <tr data-id="${p._id}">
                            <td>${p.policyName || ""}</td>
                            <td>${p.effectiveDate
                                ? new Date(p.effectiveDate).toLocaleDateString()
                                : ""}</td>

                            <td>
                                <button class="view-policy"
                                    data-url="${p.attachments?.[0]?.url}">
                                    View
                                </button>
                            </td>

                            <td>

                                <button class="edit-policy"
                                    data-id="${p._id}">
                                    Edit
                                </button>

                                <button class="delete-policy"
                                    data-id="${p._id}">
                                    Delete
                                </button>

                            </td>
                        </tr>

                    `).join("")}
                </tbody>
            </table>
        `;
    }

    // ================= GLOBAL EVENTS =================
    document.addEventListener("click", async (e) => {

        // ================= VIEW PDF =================
        if (e.target.classList.contains("view-policy")) {

            const url = e.target.dataset.url;

            if (url) {
                window.open(url, "_blank");
            }

            return;
        }

        // ================= DELETE =================
        if (e.target.classList.contains("delete-policy")) {

            const id = e.target.dataset.id;

            if (!confirm("Delete this policy?")) return;

            const res = await deletePolicy(id);

            alert(res.message);

            if (res.success) {
                loadAndRender();
            }

            return;
        }

        // ================= EDIT =================
        if (e.target.classList.contains("edit-policy")) {

            const row = e.target.closest("tr");

            editingId = e.target.dataset.id;

            document.getElementById("policyName").value =
                row.children[0].innerText; 

            const rawDate =
                row.children[1].innerText;

            document.getElementById("effectiveDate").value =
                rawDate ? new Date(rawDate).toISOString().split("T")[0] : "";

            return;
        }
    });

    // ================= HELPERS =================
    function isEditMode() {
        return !!editingId;
    }

    return { render };

})();

export default PolicyModule;