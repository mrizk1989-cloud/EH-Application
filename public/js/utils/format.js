export function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "";

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}