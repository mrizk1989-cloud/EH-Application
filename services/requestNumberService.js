const Counter = require('../models/Counter');

/**
 * Get next master request number (EHR-0000001)
 * SAFE FOR CONCURRENT USERS
 */
async function getNextMasterRequestNumber() {

    const counter = await Counter.findByIdAndUpdate(
        { _id: "EHR_COUNTER" },
        { $inc: { value: 1 } },
        {
            new: true,
            upsert: true
        }
    );

    const number = counter.value.toString().padStart(7, '0');

    return `EHR-${number}`;
}

/**
 * Generate sub request numbers
 * Example:
 * EHR-0000001-01
 * EHR-0000001-02
 */
function generateSubRequestNumbers(masterRequestNo, items = []) {

    return items.map((item, index) => {

        const subNo = String(index + 1).padStart(2, '0');

        return {
            ...item,
            subRequestNo: `${masterRequestNo}-${subNo}`
        };
    });
}

module.exports = {
    getNextMasterRequestNumber,
    generateSubRequestNumbers
};