import type { Bucket, Category, PayFrequency, Profile, Transaction } from "@/types";
import { BUCKETS } from "@/types";

// Convert a paycheck amount + frequency into an approximate monthly figure.
export function toMonthlyIncome(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "monthly":
    default:
      return amount;
  }
}

// Reverse of toMonthlyIncome: turn a monthly figure back into a per-paycheck
// amount for the given frequency so the form value round-trips.
export function fromMonthlyIncome(monthly: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly":
      return (monthly * 12) / 52;
    case "biweekly":
      return (monthly * 12) / 26;
    case "monthly":
    default:
      return monthly;
  }
}

export function bucketPercent(profile: Profile, bucket: Bucket): number {
  switch (bucket) {
    case "needs":
      return profile.needsPercent;
    case "wants":
      return profile.wantsPercent;
    case "savings":
      return profile.savingsPercent;
  }
}

export function bucketLimit(profile: Profile, bucket: Bucket): number {
  return (profile.monthlyIncome * bucketPercent(profile, bucket)) / 100;
}

// Build a quick lookup from categoryId -> bucket.
export function categoryBucketMap(categories: Category[]): Map<number, Bucket> {
  const map = new Map<number, Bucket>();
  for (const c of categories) {
    if (c.id != null) map.set(c.id, c.bucket);
  }
  return map;
}

export function isInMonth(tx: Transaction, monthKey: string): boolean {
  return tx.date.startsWith(monthKey);
}

/** Net spending contribution: expenses add, paybacks subtract, income is 0. */
export function spendingDelta(t: Transaction): number {
  switch (t.type) {
    case "expense":
      return t.amount;
    case "payback":
      return -t.amount;
    case "income":
      return 0;
  }
}

export function isSpendingType(t: Transaction): boolean {
  return t.type === "expense" || t.type === "payback";
}

export interface BucketStatus {
  bucket: Bucket;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number; // 0-100+, spent / limit
  over: boolean;
}

export function computeBucketStatus(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  monthKey: string,
  bucket: Bucket
): BucketStatus {
  const map = categoryBucketMap(categories);
  const limit = bucketLimit(profile, bucket);
  const spent = transactions
    .filter(
      (t) =>
        isSpendingType(t) &&
        isInMonth(t, monthKey) &&
        map.get(t.categoryId) === bucket
    )
    .reduce((sum, t) => sum + spendingDelta(t), 0);
  const remaining = limit - spent;
  const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;
  return { bucket, limit, spent, remaining, percentUsed, over: spent > limit };
}

export function computeAllBuckets(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  monthKey: string
): Record<Bucket, BucketStatus> {
  return BUCKETS.reduce(
    (acc, b) => {
      acc[b] = computeBucketStatus(profile, categories, transactions, monthKey, b);
      return acc;
    },
    {} as Record<Bucket, BucketStatus>
  );
}

export function totalIncomeThisMonth(
  transactions: Transaction[],
  monthKey: string
): number {
  return transactions
    .filter((t) => t.type === "income" && isInMonth(t, monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function totalSpentThisMonth(
  transactions: Transaction[],
  monthKey: string
): number {
  return transactions
    .filter((t) => isSpendingType(t) && isInMonth(t, monthKey))
    .reduce((sum, t) => sum + spendingDelta(t), 0);
}

export interface IncomeBreakdown {
  /** Planned monthly income from profile — drives bucket limits, not surplus. */
  plannedIncome: number;
  /** Sum of income transactions logged this month. */
  loggedIncome: number;
}

export function getIncomeBreakdown(
  profile: Profile,
  transactions: Transaction[],
  monthKey: string
): IncomeBreakdown {
  return {
    plannedIncome: profile.monthlyIncome,
    loggedIncome: totalIncomeThisMonth(transactions, monthKey),
  };
}

/** Sum of `type === 'income'` transactions in the selected month. */
export function getLoggedIncomeThisMonth(
  transactions: Transaction[],
  monthKey: string
): number {
  return totalIncomeThisMonth(transactions, monthKey);
}

/** Logged income this month (not planned monthly income). */
export function getEffectiveIncome(
  _profile: Profile,
  transactions: Transaction[],
  monthKey: string
): number {
  return getLoggedIncomeThisMonth(transactions, monthKey);
}

export interface MonthlySurplus extends IncomeBreakdown {
  netSpent: number;
  surplus: number;
  /** True when logged income exceeds net spending. */
  underspent: boolean;
}

/** Income left after spending: loggedIncome − netSpent (can be negative). */
export function getMonthlySurplus(
  profile: Profile,
  transactions: Transaction[],
  monthKey: string
): MonthlySurplus {
  const { plannedIncome, loggedIncome } = getIncomeBreakdown(
    profile,
    transactions,
    monthKey
  );
  const netSpent = totalSpentThisMonth(transactions, monthKey);
  const surplus = loggedIncome - netSpent;
  return {
    plannedIncome,
    loggedIncome,
    netSpent,
    surplus,
    underspent: surplus > 0,
  };
}

/** Sum of positive bucket remainings — unused budget headroom across Needs/Wants/Savings. */
export function getBudgetHeadroom(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  monthKey: string
): number {
  const buckets = computeAllBuckets(profile, categories, transactions, monthKey);
  return BUCKETS.reduce((sum, b) => sum + Math.max(0, buckets[b].remaining), 0);
}

// "Safe to spend" focuses on the Wants bucket — the most flexible day-to-day money.
export function safeToSpend(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  monthKey: string
): number {
  return computeBucketStatus(profile, categories, transactions, monthKey, "wants")
    .remaining;
}
