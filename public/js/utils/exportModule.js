const ExportModule = (() => {

    let userRole = null;

    const collections = [
        { label: "Users", value: "users" },
        { label: "Requests", value: "masterRequests" },
        { label: "Request Items", value: "requestItems" },
        { label: "Currencies", value: "currencies" },
        { label: "Exchange Rates", value: "exchangeRates" },
        { label: "Expense Types", value: "expenseTypes" },
        { label: "Customers", value: "customers" },
        { label: "Upload Logs", value: "uploadLogs" },
        { label: "Counters", value: "counters" },
        { label: "EHPolicy", value: "EHPolicy" },
        { label: "EHPerformance", value: "EHPerformance" }
    ];

    function setRole(role) {
        userRole = role;
    }

    

    function getAllowedCollections() {

        if (userRole === "admin") return collections;

        // ALL NON-ADMINS ONLY requestItems
        return collections.filter(c => c.value === "requestItems");
    }

    function render(containerId) {
        
        const container = document.getElementById(containerId);
        if (!container) return;

        const allowed = getAllowedCollections();

        container.innerHTML = `
            <div class="export-box">
                <select id="exportCollection">
                    ${allowed.map(c => `
                        <option value="${c.value}">${c.label}</option>
                    `).join("")}
                </select>

                <button id="exportBtn" class="exportBtn">Export Excel</button>
                
            </div>
        `;

        const exportBtn = container.querySelector("#exportBtn");
        // const closeBtn = container.querySelector("#closeExportBtn");

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const collection = container.querySelector("#exportCollection")?.value;
                if (!collection) return;
                
                window.location.href = `/api/export/${collection}`;
            });
        }

        // if (closeBtn) {
        //     closeBtn.addEventListener("click", () => {
        //         container.classList.add("hidden");
        //     });
        // }
    }

    return { render, setRole };

})();

export default ExportModule;