const EHPolicy = require("../models/EHPolicy");
const EHPerformance = require("../models/EHPerformance");
const RequestItem = require("../models/RequestItem");

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function getPerformanceYear(month) {
    const parts = String(month || "").split("-");
    const first = Number(parts[0]);
    const second = Number(parts[1]);

    if (first >= 1900) return first;
    if (second >= 1900) return second;

    return NaN;
}

async function calculateRemainingBudget({ area, country, year }) {
    const requestYear = Number(year);

    if (!area || !country || !requestYear) {
        return null;
    }

    const policies = await EHPolicy.find({ year: requestYear });

    const policy = policies.find(p =>
        normalize(p.territory) === normalize(area) &&
        normalize(p.country) === normalize(country)
    );

    if (!policy) return null;

    const performance = await EHPerformance.find({});

    const perfRows = performance.filter(p =>
        normalize(p.territory) === normalize(area) &&
        getPerformanceYear(p.month) === requestYear
    );

    const latestPerf = perfRows.sort((a, b) =>
        String(b.month || "").localeCompare(String(a.month || ""))
    )[0];

    const availableBudget =
        Number(policy.budget || 0) *
        ((Number(latestPerf?.performancePercent) || 0) / 100);

    const approvedItems = await RequestItem.find({
        requestPeriodYear: requestYear,
        status: "approved"
    });

    const approvedExpenses = approvedItems
        .filter(i =>
            normalize(i.salesTerritory) === normalize(area) &&
            normalize(i.salesCountry) === normalize(country)
        )
        .reduce((sum, i) => sum + Number(i.amountSAR || 0), 0);

    const depreciation = perfRows.reduce(
        (sum, p) => sum + Number(p.depreciationAmount || 0),
        0
    );

    return availableBudget - approvedExpenses - depreciation;
}

async function attachRemainingBudgetToRequests(requests = []) {
    const result = [];

    for (const request of requests) {
        const plain = request.toObject ? request.toObject() : { ...request };

        const items =
            plain.items ||
            await RequestItem.find({ requestId: plain._id });

        const firstItem = items[0];

        plain.remainingBudgetSAR = await calculateRemainingBudget({
            area: firstItem?.salesTerritory || plain.userArea?.[0],
            country: firstItem?.salesCountry,
            year: firstItem?.requestPeriodYear
        });

        result.push(plain);
    }

    return result;
}

module.exports = {
    attachRemainingBudgetToRequests
};