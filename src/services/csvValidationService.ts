import { parse } from "csv-parse/sync";

interface CSVRow {
  serialNumber: number;
  productName: string;
  inputImageUrls: string;
}

export function validateCSV(data: string): CSVRow[] {
  const records: CSVRow[] = parse(data, {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(records);

  for (const record of records) {
    if (!record.serialNumber || !record.productName || !record.inputImageUrls) {
      throw new Error("CSV is not formatted correctly.");
    }
  }

  return records;
}
