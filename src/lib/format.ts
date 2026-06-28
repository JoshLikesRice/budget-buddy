export function formatCurrency(
  amount: number,
  currency = "USD",
  opts: { withCents?: boolean } = {}
): string {
  const { withCents = false } = opts;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: withCents ? 2 : 0,
      maximumFractionDigits: withCents ? 2 : 0,
    }).format(amount);
  } catch {
    // Fallback if an invalid currency code is stored
    return `$${amount.toFixed(withCents ? 2 : 0)}`;
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Returns a yyyy-MM month key, e.g. "2026-06"
export function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function shortMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short" });
}

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Days remaining in the month for the given key, relative to today.
// If the month is in the past, returns 0. If in the future, returns full month length.
export function daysLeftInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  const now = new Date();
  const nowKey = monthKey(now);
  const lastDay = new Date(y, m, 0).getDate();
  if (key < nowKey) return 0;
  if (key > nowKey) return lastDay;
  return Math.max(0, lastDay - now.getDate());
}
