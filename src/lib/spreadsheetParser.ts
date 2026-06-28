import * as XLSX from "xlsx";

export interface ParsedSpreadsheetRow {
  date: string;
  amount: number;
  description: string;
  confidence: "high" | "low";
}

const DATE_KEYWORDS = [
  "date",
  "transaction date",
  "trans date",
  "posted",
  "post date",
  "posting date",
  "txn date",
  "value date",
  "book date",
  "time",
  "datum",
];

const AMOUNT_KEYWORDS = [
  "amount",
  "debit",
  "withdrawal",
  "withdrawals",
  "charge",
  "payment amount",
  "value",
  "sum",
  "total",
  "out",
];

const CREDIT_KEYWORDS = ["credit", "deposit", "deposits", "payment in"];

const DESCRIPTION_KEYWORDS = [
  "description",
  "memo",
  "merchant",
  "payee",
  "details",
  "category",
  "category name",
  "narration",
  "reference",
  "particulars",
  "name",
  "transaction",
  "note",
  "payee name",
];

const SKIP_ROW =
  /\b(balance|opening balance|closing balance|total|subtotal|summary|account number)\b/i;

interface ColumnMap {
  date: number;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  description: number | null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function inferYear(month: number, day: number): number {
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (candidate > now) return year - 1;
  return year;
}

function parseSlashDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (!m) return null;

  const a = Number(m[1]);
  const b = Number(m[2]);
  let year = new Date().getFullYear();

  if (m[3]) {
    year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
  }

  // Prefer MM/DD for US-style exports; fall back to DD/MM when invalid.
  let iso = toIsoDate(m[3] ? year : inferYear(a, b), a, b);
  if (!iso && !m[3]) {
    iso = toIsoDate(inferYear(b, a), b, a);
  }
  return iso;
}

function parseIsoDate(raw: string): string | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return toIsoDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

function parseCellDate(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return toIsoDate(parsed.y, parsed.m, parsed.d);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const iso = parseIsoDate(trimmed.slice(0, 10));
    if (iso) return iso;

    const slash = parseSlashDate(trimmed);
    if (slash) return slash;

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return toIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
  }

  return null;
}

function parseCellAmount(value: unknown): number | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
    return Math.abs(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = trimmed
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .replace(/\(\s*([\d.]+)\s*\)/, "-$1")
      .replace(/\s*(CR|DR)\.?$/i, "")
      .trim();

    const valueNum = parseFloat(numeric);
    if (!Number.isFinite(valueNum) || valueNum === 0) return null;
    return Math.abs(valueNum);
  }

  return null;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, " ");
}

function scoreHeader(header: string, keywords: readonly string[]): number {
  if (!header) return 0;
  let score = 0;
  for (const kw of keywords) {
    if (header === kw) score += 10;
    else if (header.includes(kw)) score += 5;
    else if (kw.split(" ").every((part) => header.includes(part))) score += 3;
  }
  return score;
}

function detectColumns(headerRow: unknown[]): ColumnMap | null {
  const headers = headerRow.map(normalizeHeader);

  let date = -1;
  let amount: number | null = null;
  let debit: number | null = null;
  let credit: number | null = null;
  let description: number | null = null;

  let bestDateScore = 0;
  let bestAmountScore = 0;
  let bestDebitScore = 0;
  let bestCreditScore = 0;
  let bestDescScore = 0;

  headers.forEach((header, index) => {
    const dateScore = scoreHeader(header, DATE_KEYWORDS);
    if (dateScore > bestDateScore) {
      bestDateScore = dateScore;
      date = index;
    }

    const amountScore = scoreHeader(header, AMOUNT_KEYWORDS);
    if (amountScore > bestAmountScore) {
      bestAmountScore = amountScore;
      amount = index;
    }

    const debitScore = scoreHeader(header, ["debit", "withdrawal", "withdrawals", "out"]);
    if (debitScore > bestDebitScore) {
      bestDebitScore = debitScore;
      debit = index;
    }

    const creditScore = scoreHeader(header, CREDIT_KEYWORDS);
    if (creditScore > bestCreditScore) {
      bestCreditScore = creditScore;
      credit = index;
    }

    const descScore = scoreHeader(header, DESCRIPTION_KEYWORDS);
    if (descScore > bestDescScore) {
      bestDescScore = descScore;
      description = index;
    }
  });

  const hasAmountColumn =
    bestAmountScore >= 3 || bestDebitScore >= 3 || bestCreditScore >= 3;

  if (date < 0 || bestDateScore < 3 || !hasAmountColumn) return null;

  // Prefer dedicated debit/credit over generic "amount" when both exist.
  if (bestDebitScore >= 3 && bestAmountScore >= 3 && debit === amount) {
    amount = null;
  }

  return { date, amount, debit, credit, description };
}

function findHeaderRow(rows: unknown[][]): { headerIndex: number; columns: ColumnMap } | null {
  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => cell == null || String(cell).trim() === "")) continue;
    const columns = detectColumns(row);
    if (columns) return { headerIndex: i, columns };
  }
  return null;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function getRowAmount(row: unknown[], columns: ColumnMap): number | null {
  if (columns.debit != null) {
    const debit = parseCellAmount(row[columns.debit]);
    if (debit != null) return debit;
  }

  if (columns.amount != null) {
    const amount = parseCellAmount(row[columns.amount]);
    if (amount != null) return amount;
  }

  if (columns.credit != null) {
    const credit = parseCellAmount(row[columns.credit]);
    if (credit != null) return credit;
  }

  return null;
}

function getRowDescription(row: unknown[], columns: ColumnMap): string {
  if (columns.description != null) {
    return cellText(row[columns.description]).slice(0, 120);
  }

  // Fall back to the longest text cell that isn't date/amount.
  const skip = new Set(
    [columns.date, columns.amount, columns.debit, columns.credit].filter(
      (v): v is number => v != null
    )
  );

  let best = "";
  row.forEach((cell, index) => {
    if (skip.has(index)) return;
    const text = cellText(cell);
    if (text.length > best.length) best = text;
  });

  return best.slice(0, 120);
}

function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => cell == null || String(cell).trim() === "");
}

function readSheetRows(file: File): Promise<unknown[][]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("That file has no sheets to import.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    if (rows.length === 0) {
      throw new Error("That spreadsheet appears to be empty.");
    }

    return rows;
  });
}

/** Parse expense rows from the first sheet of an Excel or CSV export. */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheetRow[]> {
  const rows = await readSheetRows(file);
  const header = findHeaderRow(rows);

  if (!header) {
    throw new Error(
      "Couldn't find date and amount columns. Check that the first row has headers like Date, Amount, and Description."
    );
  }

  const { headerIndex, columns } = header;
  const results: ParsedSpreadsheetRow[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || isEmptyRow(row)) continue;

    const date = parseCellDate(row[columns.date]);
    const amount = getRowAmount(row, columns);
    const description = getRowDescription(row, columns);

    if (!date || amount == null) continue;
    if (description && SKIP_ROW.test(description)) continue;

    const confidence: ParsedSpreadsheetRow["confidence"] =
      date.length === 10 && amount >= 0.01 && description.length >= 2 ? "high" : "low";

    results.push({
      date,
      amount,
      description: description || "Imported transaction",
      confidence,
    });
  }

  return results;
}
