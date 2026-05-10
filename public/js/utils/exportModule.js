const ExportModule = (() => {

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
        { label: "EHPerformance", value: "EHPerformance" },
        { label: "UploadLog", value: "UploadLog" },
    ];

    function render(containerId) {
        const container = document.getElementById(containerId);

        container.innerHTML = `
            <div class="export-box">
                <select id="exportCollection">
                    ${collections.map(c =>
                        `<option value="${c.value}">${c.label}</option>`
                    ).join("")}
                </select>

                <button id="exportBtn" class="exportBtn">Export Excel</button>
            </div>
        `;

        document.getElementById("exportBtn").addEventListener("click", async () => {
            const collection = document.getElementById("exportCollection").value;

            window.location.href = `/api/export/${collection}`;
        });
    }

    return { render };
})();

export default ExportModule;