"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCSV = validateCSV;
const sync_1 = require("csv-parse/sync");
function validateCSV(data) {
    const records = (0, sync_1.parse)(data, {
        columns: true,
        skip_empty_lines: true,
    });
    for (const record of records) {
        if (!record.serialNumber || !record.productName || !record.inputImageUrls) {
            throw new Error("CSV is not formatted correctly.");
        }
    }
    return records;
}
