export interface ParsedLine {
  date: string;
  amount: number;
  description: string;
  confidence: "high" | "low";
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const SKIP_LINE =
  /\b(balance|previous balance|new balance|opening balance|closing balance|account summary|statement period|page \d|continued|total charges|total payments|minimum payment due|credit limit|available credit|payment thank you|thank you for your payment|autopay|online payment|direct deposit|interest earned|annual percentage rate|apr|member since|account number|customer service)\b/i;

const CREDIT_HINT =
  /\b(cr|credit|payment received|payment thank you|refund|deposit|direct dep|payroll|interest earned)\b/i;

const AMOUNT_PATTERN =
  /(?:\(\s*[\d,]+\.\d{2}\s*\)|-\$?\s*[\d,]+\.\d{2}|\$?\s*[\d,]+\.\d{2}\s*(?:CR|DR)?)/gi;

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

function inferYear(month: number, day: number, hintYear?: number): number {
  if (hintYear) return hintYear;
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (candidate > now) return year - 1;
  return year;
}

function parseSlashDate(raw: string, hintYear?: number): string | null {
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = hintYear ?? new Date().getFullYear();
  if (m[3]) {
    year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
  } else {
    year = inferYear(month, day, hintYear);
  }
  return toIsoDate(year, month, day);
}

function parseIsoDate(raw: string): string | null {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return toIsoDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

function parseMonthNameDate(raw: string, hintYear?: number): string | null {
  const m = raw.match(
    /^([A-Za-z]+)\.?\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/
  );
  if (!m) return null;
  const month = MONTH_NAMES[m[1].toLowerCase()];
  if (!month) return null;
  const day = Number(m[2]);
  let year = hintYear ?? new Date().getFullYear();
  if (m[3]) {
    year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
  } else {
    year = inferYear(month, day, hintYear);
  }
  return toIsoDate(year, month, day);
}

function findDateInLine(line: string, hintYear?: number): { date: string; index: number; length: number } | null {
  const patterns: { re: RegExp; parse: (s: string) => string | null }[] = [
    { re: /\b(\d{4}-\d{2}-\d{2})\b/, parse: parseIsoDate },
    {
      re: /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
      parse: (s) => parseSlashDate(s, hintYear),
    },
    {
      re: /\b(\d{1,2}[/-]\d{1,2})\b/,
      parse: (s) => parseSlashDate(s, hintYear),
    },
    {
      re: /\b([A-Za-z]+\.?\s+\d{1,2}(?:,?\s+\d{2,4})?)\b/,
      parse: (s) => parseMonthNameDate(s, hintYear),
    },
  ];

  for (const { re, parse } of patterns) {
    const match = line.match(re);
    if (!match) continue;
    const iso = parse(match[1]);
    if (iso) {
      return { date: iso, index: match.index ?? 0, length: match[1].length };
    }
  }
  return null;
}

function parseAmount(raw: string): { amount: number; isCredit: boolean } | null {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const isCredit =
    upper.endsWith(" CR") ||
    (/\bcr\b/i.test(trimmed) && !/\bdr\b/i.test(trimmed));

  let numeric = trimmed
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\(\s*([\d.]+)\s*\)/, "$1")
    .replace(/\s*(CR|DR)\.?$/i, "")
    .replace(/^-/, "")
    .trim();

  const value = parseFloat(numeric);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;

  return { amount: value, isCredit };
}

function findAmountInLine(line: string): { amount: number; isCredit: boolean; index: number } | null {
  const matches = [...line.matchAll(AMOUNT_PATTERN)];
  if (matches.length === 0) return null;

  // Prefer the last amount on the line (common in statement layouts).
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const parsed = parseAmount(match[0]);
    if (parsed) {
      return { ...parsed, index: match.index ?? 0 };
    }
  }
  return null;
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizeKey(line: ParsedLine): string {
  return `${line.date}|${line.amount.toFixed(2)}|${line.description.toLowerCase()}`;
}

function detectStatementYear(text: string): number | undefined {
  const m = text.match(/\b(20\d{2})\b/);
  return m ? Number(m[1]) : undefined;
}

/** Parse likely expense lines from bank/credit-card statement text. */
export function parseExpensesFromText(text: string): ParsedLine[] {
  if (!text.trim()) return [];

  const hintYear = detectStatementYear(text);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedLine[] = [];

  for (const line of lines) {
    if (line.length < 8) continue;
    if (SKIP_LINE.test(line)) continue;
    if (/^\d+\s*of\s*\d+$/i.test(line)) continue;

    const dateMatch = findDateInLine(line, hintYear);
    const amountMatch = findAmountInLine(line);
    if (!dateMatch || !amountMatch) continue;

    const lower = line.toLowerCase();
    if (CREDIT_HINT.test(lower) && !lower.includes("purchase")) continue;
    if (amountMatch.isCredit) continue;

    const before = line.slice(0, Math.min(dateMatch.index, amountMatch.index));
    const after = line.slice(Math.max(dateMatch.index + dateMatch.length, amountMatch.index + 8));
    let description = cleanDescription(`${before} ${after}`);
    if (!description || description.length < 2) {
      description = cleanDescription(line.replace(AMOUNT_PATTERN, "").replace(/\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/g, ""));
    }
    if (!description || description.length < 2) continue;

    const confidence: ParsedLine["confidence"] =
      dateMatch.date.length === 10 && amountMatch.amount >= 0.01 && description.length >= 4
        ? "high"
        : "low";

    results.push({
      date: dateMatch.date,
      amount: amountMatch.amount,
      description,
      confidence,
    });
  }

  return dedupeLines(results);
}

function dedupeLines(lines: ParsedLine[]): ParsedLine[] {
  const seen = new Set<string>();
  const out: ParsedLine[] = [];
  for (const line of lines) {
    const key = normalizeKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}
