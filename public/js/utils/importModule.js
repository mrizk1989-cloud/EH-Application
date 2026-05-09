const ImportModule = (() => {

    let csvData = [];
    let columns = [];
    let dbFields = [];

    // =====================================================
    // RENDER
    // =====================================================

    async function render(containerId) {

        const container =
            document.getElementById(containerId);

        container.innerHTML = `
        <div class="sap-import">

            <div class="sap-header">

                <select id="collectionSelect"></select>

                <input
                    type="file"
                    id="fileInput"
                    accept=".csv"
                >

                <button id="loadBtn">
                    Load CSV
                </button>

            </div>

            <div class="sap-grid">

                <div class="sap-panel">

                    <h3>Preview</h3>

                    <div id="tablePreview"></div>

                </div>

                <div class="sap-panel">

                    <h3>Mapping</h3>

                    <div id="mappingPanel"></div>

                </div>

            </div>

            <div class="sap-footer">

            
                <button id="validateBtn">
                    Validate
                </button>

                <select id="duplicateField">
                    <option value="">
                        Duplicate Check Field
                    </option>
                </select>
            

                <button id="dryRunBtn">
                    Dry Run
                </button>

                <button id="importBtn">
                    Execute
                </button>

                

                <div class="progress-container">

                    <div id="progressBar"></div>

                    <span id="progressText">
                        0%
                    </span>

                </div>

                <div id="statusBox"></div>

            </div>

        </div>
        `;

        await loadCollections();

        await loadFields();

        document
            .getElementById("collectionSelect")
            .addEventListener(
                "change",
                loadFields
            );

        document
            .getElementById("loadBtn")
            .onclick = loadCSV;

        document
            .getElementById("validateBtn")
            .onclick = validate;

        document
            .getElementById("dryRunBtn")
            .onclick = dryRun;

        document
            .getElementById("importBtn")
            .onclick = execute;
    }

    // =====================================================
    // LOAD COLLECTIONS
    // =====================================================

    async function loadCollections() {

        const res = await fetch(
            "/api/import/collections",
            {
                credentials: "include"
            }
        );

        const data = await res.json();

        const select =
            document.getElementById(
                "collectionSelect"
            );

        select.innerHTML =
            data.collections.map(c => `
                <option value="${c.value}">
                    ${c.label}
                </option>
            `).join("");
    }

    // =====================================================
    // LOAD FIELDS
    // =====================================================

    async function loadFields() {

        const collection =
            document.getElementById(
                "collectionSelect"
            ).value;

        const res = await fetch(
            `/api/import/fields/${collection}`,
            {
                credentials: "include"
            }
        );

        const data = await res.json();

        dbFields = data.fields || [];

        // duplicate dropdown

        const dupSelect =
            document.getElementById(
                "duplicateField"
            );

        dupSelect.innerHTML = `
            <option value="">
                Duplicate Check Field
            </option>
            ${dbFields.map(f => `
                <option value="${f}">
                    ${f}
                </option>
            `).join("")}
        `;

        renderMapping();
    }

    // =====================================================
    // LOAD CSV
    // =====================================================

    async function loadCSV() {

        const file =
            document
                .getElementById("fileInput")
                .files[0];

        if (!file) {
            return alert("Select CSV");
        }

        const form = new FormData();

        form.append("file", file);

        const res = await fetch(
            "/api/import/preview",
            {
                method: "POST",
                credentials: "include",
                body: form
            }
        );

        const data = await res.json();

        csvData = data.fullData;

        columns = data.columns;

        renderTable();

        renderMapping();
    }

    // =====================================================
    // TABLE
    // =====================================================

    function renderTable() {

        const el =
            document.getElementById(
                "tablePreview"
            );

        let html = `
            <table class="sap-table">

                <thead>
                    <tr>
        `;

        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });

        html += `
                    </tr>
                </thead>

                <tbody>
        `;

        csvData.slice(0, 20).forEach(row => {

            html += `<tr>`;

            columns.forEach(col => {

                html += `
                    <td>
                        ${row[col] || ""}
                    </td>
                `;

            });

            html += `</tr>`;
        });

        html += `
                </tbody>

            </table>
        `;

        el.innerHTML = html;
    }

    // =====================================================
    // MAPPING
    // =====================================================

    function renderMapping() {

        const el =
            document.getElementById(
                "mappingPanel"
            );

        el.innerHTML =
            columns.map(col => `
                <div class="map-row">

                    <span>${col}</span>

                    <select data-col="${col}">

                        <option value="">
                            Ignore
                        </option>

                        ${dbFields.map(field => `
                            <option value="${field}">
                                ${field}
                            </option>
                        `).join("")}

                    </select>

                </div>
            `).join("");
    }

    // =====================================================
    // GET MAPPING
    // =====================================================

    function getMapping() {

        const map = {};

        document
            .querySelectorAll(
                "#mappingPanel select"
            )
            .forEach(s => {

                if (s.value) {

                    map[s.dataset.col] = s.value;

                }

            });

        return map;
    }

    // =====================================================
    // VALIDATE
    // =====================================================

    async function validate() {

        const duplicateField =
            document.getElementById(
                "duplicateField"
            ).value;

        const res = await fetch(
            "/api/import/confirm",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    mapping: getMapping(),

                    data: csvData,

                    collection:
                        document.getElementById(
                            "collectionSelect"
                        ).value,

                    duplicateField
                })
            }
        );

        const data = await res.json();

        highlightDuplicates(
            data.duplicatesInCSV,
            data.duplicatesInDB,
            duplicateField
        );

        document.getElementById(
            "statusBox"
        ).innerHTML = `
            ✅ Valid rows: ${data.total}
            <br>
            🟠 CSV duplicates:
            ${data.duplicatesInCSV.length}
            <br>
            🔴 DB duplicates:
            ${data.duplicatesInDB.length}
        `;
    }

    // =====================================================
    // HIGHLIGHT DUPLICATES
    // =====================================================

    function highlightDuplicates(
        csvDupes,
        dbDupes,
        field
    ) {

        const index = columns.findIndex(c =>
            c.trim().replace(/^\uFEFF/, "") === field.trim()
        );

        if (index === -1) return;

        document
            .querySelectorAll(
                "#tablePreview tbody tr"
            )
            .forEach(row => {

                const cells =
                    row.querySelectorAll("td");

                cells.forEach(cell => {
                    cell.style.background = "";
                });

                const cell = cells[index];

                const value =
                    cell.innerText.trim();

                if (
                    csvDupes.includes(value)
                ) {

                    cell.style.background =
                        "#ff9800";

                }

                if (
                    dbDupes.includes(value)
                ) {

                    cell.style.background =
                        "#ff4d4d";

                }

            });
    }

    // =====================================================
    // DRY RUN
    // =====================================================

    async function dryRun() {

        const res = await fetch(
            "/api/import/execute",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    collection:
                        document.getElementById(
                            "collectionSelect"
                        ).value,

                    docs: csvData,

                    dryRun: true
                })
            }
        );

        const data = await res.json();

        document.getElementById(
            "statusBox"
        ).innerHTML = `
            🟡 Dry Run Complete
            (${data.total} rows)
        `;
    }

    // =====================================================
    // EXECUTE
    // =====================================================

    async function execute() {

        const res = await fetch(
            "/api/import/execute",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    collection:
                        document.getElementById("collectionSelect").value,

                    docs: csvData,

                    duplicateField:
                        document.getElementById("duplicateField").value,

                    skipDuplicates: true
                })
            }
        );

        const data = await res.json();

        document.getElementById(
            "progressBar"
        ).style.width = "100%";

        document.getElementById(
            "progressText"
        ).innerText = "100%";

        document.getElementById(
            "statusBox"
        ).innerHTML = `
            🟢 Imported
            ${data.inserted}
            rows
        `;
    }

    return { render };

})();

export default ImportModule;