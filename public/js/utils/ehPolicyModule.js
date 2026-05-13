function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "";

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


const $ = (id) => document.getElementById(id);

const EhPolicyModule = (() => {

    function render(containerId) {

        const container = document.getElementById(containerId);

        container.innerHTML = `
        <div class="ehp-wrapper">

            <div class="ehp-tabs">
                <button data-tab="policy">Budget</button>
                <button data-tab="performance">Performance</button>
                <button data-tab="dashboard">Dashboard</button>
            </div>

            <div class="ehp-section active" id="policy">
                <h3>Budget Manager</h3>

                <div class="ehp-form">
                    <input id="p_country" placeholder="Country">
                    <input id="p_territory" placeholder="Territory">
                    <input id="p_year" type="number" placeholder="Year">
                    <input id="p_budget" type="number" placeholder="Budget SAR">
                    <button id="createPolicyBtn">Create</button>
                </div>

                <div id="policyList"></div>
            </div>

            <div class="ehp-section" id="performance">
                <h3>Performance</h3>

                <div class="ehp-form">
                    <input id="pf_territory" placeholder="Territory">
                    <input id="pf_month" placeholder="YYYY-MM">
                    <input id="pf_percent" type="number" placeholder="Performance %">
                    <input id="pf_demo" type="number" placeholder="Demo Expense">
                    <input id="pf_depreciation" type="number" placeholder="Depreciation Expense">
                    <button id="createPerfBtn">Create</button>
                </div>

                <div id="performanceList"></div>
            </div>

            <div class="ehp-section" id="dashboard">
                <h3>Dashboard</h3>

                <div class="ehp-form">
                    <input id="dYear" type="number" placeholder="Year">
                    <button id="loadDashboardBtn">Load</button>
                </div>

                <div id="dashboardResult"></div>
            </div>

        </div>
        `;

        bindEvents();
        loadPolicies();
        loadPerformance();
    }

    async function loadPolicies() {

        const res = await fetch("/api/eh/policy", { credentials: "include" });
        const json = await res.json();
        const data = json.policies || [];

        let html = `
    <table class="sap-table">
        <thead>
            <tr>
                <th>Country</th>
                <th>Territory</th>
                <th>Year</th>
                <th>Budget</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

        data.forEach(p => {
            html += `
        <tr data-id="${p._id}">
            <td>${p.country}</td>
            <td>${p.territory}</td>
            <td>${p.year}</td>
            <td>${formatNumber(p.budget)}</td>
            <td>
                <button class="edit-policy">Edit</button>
                <button class="delete-policy">Delete</button>
            </td>
        </tr>
        `;
        });

        html += `</tbody></table>`;

        document.getElementById("policyList").innerHTML = html;

        // DELETE
        document.querySelectorAll(".delete-policy").forEach(btn => {
            btn.onclick = async () => {
                const id = btn.closest("tr").dataset.id;

                await fetch(`/api/eh/policy/${id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                loadPolicies();
            };
        });

        // EDIT
        document.querySelectorAll(".edit-policy").forEach(btn => {
            btn.onclick = (e) => {

                const tr = e.target.closest("tr");

                $("p_country").value = tr.children[0].innerText;
                $("p_territory").value = tr.children[1].innerText;
                $("p_year").value = tr.children[2].innerText;
                $("p_budget").value = tr.children[3].innerText;

                // clear previous edits
                document.querySelectorAll("#policyList tr")
                    .forEach(t => t.removeAttribute("data-editing"));

                tr.dataset.editing = tr.dataset.id;
            };
        });
    }

    async function loadPerformance() {

        const res = await fetch("/api/eh/performance", { credentials: "include" });
        const json = await res.json();

        const data = json.data || [];

        let html = `
    <table class="sap-table">
        <thead>
            <tr>
                <th>Territory</th>
                <th>Month</th>
                <th>Performance %</th>
                <th>Demo Expense</th>
                <th>Depreciation</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

        data.forEach(p => {
            html += `
        <tr data-id="${p._id}">
            <td>${p.territory}</td>
            <td>${p.month}</td>
            <td>${formatNumber(p.performancePercent)}%</td>
            <td>${formatNumber(p.demoCount)}</td>
            <td>${formatNumber(p.depreciationAmount) || 0}</td>
            <td>
                <button class="edit-perf">Edit</button>
                <button class="delete-perf">Delete</button>
            </td>
        </tr>
        `;
        });

        html += `</tbody></table>`;

        document.getElementById("performanceList").innerHTML = html;

        // ================= EDIT PERFORMANCE =================
        document.querySelectorAll(".edit-perf").forEach(btn => {

            btn.onclick = (e) => {

                const tr = e.target.closest("tr");

                $("pf_territory").value = tr.children[0].innerText;
                $("pf_month").value = tr.children[1].innerText;
                $("pf_percent").value =
                    tr.children[2].innerText.replace("%", "");

                $("pf_demo").value =
                    tr.children[3].innerText;

                $("pf_depreciation").value =
                    tr.children[4].innerText;

                document.querySelectorAll("#performanceList tr")
                    .forEach(t => t.removeAttribute("data-editing"));

                tr.dataset.editing = tr.dataset.id;
            };
        });
        document.querySelectorAll(".delete-perf").forEach(btn => {
            btn.onclick = async (e) => {

                const tr = e.target.closest("tr");
                const id = tr.dataset.id;

                await fetch(`/api/eh/performance/${id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                loadPerformance();
            };
        });
    }


    function bindEvents() {

        // ================= TAB SWITCH =================
        document.querySelectorAll(".ehp-tabs button").forEach(btn => {

            btn.addEventListener("click", () => {

                document.querySelectorAll(".ehp-section")
                    .forEach(s => s.classList.remove("active"));

                const target = document.getElementById(btn.dataset.tab);

                if (target) {
                    target.classList.add("active");
                }
            });
        });

        // ================= SAFE ELEMENT GETTER =================
        // const $ = (id) => document.getElementById(id);

        // ================= POLICY =================
        const createPolicyBtn = $("createPolicyBtn");
        if (createPolicyBtn) {

            createPolicyBtn.addEventListener("click", async () => {

                const editingId = document.querySelector("#policyList tr[data-editing]")?.dataset.editing;

                const payload = {
                    country: $("p_country").value,
                    territory: p_territory.value,
                    year: Number(p_year.value),
                    budget: Number(p_budget.value)
                };

                if (editingId) {

                    await fetch(`/api/eh/policy/${editingId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });

                    document.querySelector(`#policyList tr[data-editing]`)?.removeAttribute("data-editing");

                } else {

                    await fetch("/api/eh/policy", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });
                }

                loadPolicies();
            });
        }

        // ================= PERFORMANCE =================
        const createPerfBtn = $("createPerfBtn");
        if (createPerfBtn) {

            createPerfBtn.addEventListener("click", async () => {

                const editingId = document.querySelector("#performanceList tr[data-editing]")?.dataset.editing;

                const payload = {
                    territory: $("pf_territory").value,
                    month: $("pf_month").value,
                    performancePercent: Number($("pf_percent").value || 0),
                    demoCount: Number($("pf_demo").value || 0),
                    depreciationAmount: Number($("pf_depreciation").value || 0)
                };

                if (editingId) {

                    await fetch(`/api/eh/performance/${editingId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });

                    document.querySelector(`#performanceList tr[data-editing]`)?.removeAttribute("data-editing");

                } else {

                    await fetch("/api/eh/performance", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });
                }

                loadPerformance();
            });
        }

        // ================= DASHBOARD =================
        const loadDashboardBtn = $("loadDashboardBtn");

        if (loadDashboardBtn) {

            loadDashboardBtn.addEventListener("click", async () => {

                const selectedYear = $("dYear").value;

                const url = selectedYear
                    ? `/api/eh/dashboard?year=${selectedYear}`
                    : "/api/eh/dashboard";

                const res = await fetch(url, {
                    credentials: "include"
                });

                const json = await res.json();
                const data = json.data;

                let html = "";

                Object.keys(data).forEach(yearKey => {

                    html += `
    <h2 style="margin-top:20px;">Year ${yearKey}</h2>

    <table class="sap-table">
        <thead>
            <tr>
                 <th>Area</th>
                <th>Budget</th>
                <th>Performance %</th>
                <th>Available Budget</th>
                <th>Expenses</th>
                <th>Depreciation</th>
                <th>Remaining</th>
                <th>Progress</th>
            </tr>
        </thead>
        <tbody>
    `;

                    data[yearKey].forEach(row => {

                        html += `
        <tr>
            <td>${row.area}</td>
            <td>${formatNumber(row.budget)}</td>
            <td>${formatNumber(row.performancePercent)}%</td>
            <td>${formatNumber(row.availableBudget)}</td>
            <td>${formatNumber(row.expenses)}</td>
            <td>${formatNumber(row.depreciation)}</td>
            <td>${formatNumber(row.remaining)}</td>
            <td>${formatNumber(row.progress)}%</td>
  
        </tr>
        `;
                    });

                    html += `
        </tbody>
    </table>
    `;
                });

                const dashboard = $("dashboardResult");
                if (dashboard) {
                    dashboard.innerHTML = html;
                }
            });
        }
    }
    return { render };

})();

export default EhPolicyModule;