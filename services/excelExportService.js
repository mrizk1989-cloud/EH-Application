const ExcelJS = require("exceljs");

async function exportToExcel({
    data,
    fileName = "export",
    columns = null
}) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");

    // ================= AUTO COLUMNS =================
    if (!columns && data.length > 0) {
        columns = Object.keys(data[0]).map(key => ({
            header: key,
            key: key,
            width: 20
        }));
    }

    sheet.columns = columns;

    // ================= ADD ROWS =================
    data.forEach(item => {
        sheet.addRow(item);
    });

    // ================= BUFFER OUTPUT =================
    const buffer = await workbook.xlsx.writeBuffer();

    return {
        buffer,
        fileName: `${fileName}`
    };
}

module.exports = {
    exportToExcel
};