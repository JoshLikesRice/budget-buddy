import type { Bucket, Category, Profile, Transaction } from "@/types";
import { BUCKET_META, BUCKETS } from "@/types";
import {
  bucketLimit,
  categoryBucketMap,
  isInMonth,
  isSpendingType,
  spendingDelta,
} from "./budget";
import { addMonths, formatCurrency, shortMonthLabel } from "./format";

export const BUCKET_COLORS: Record<Bucket, string> = {
  needs: "#2563eb",
  wants: "#f59e0b",
  savings: "#10b981",
};

export interface BucketBreakdown {
  needs: number;
  wants: number;
  savings: number;
  total: number;
  segments: { bucket: Bucket; label: string; value: number; color: string }[];
}

/** Planned bucket limits from profile income × percents (always all 3 buckets). */
export function getBudgetPlanBreakdown(profile: Profile): BucketBreakdown {
  const needs = bucketLimit(profile, "needs");
  const wants = bucketLimit(profile, "wants");
  const savings = bucketLimit(profile, "savings");
  const total = profile.monthlyIncome;
  return {
    needs,
    wants,
    savings,
    total,
    segments: BUCKETS.map((bucket) => ({
      bucket,
      label: BUCKET_META[bucket].label,
      value: bucketLimit(profile, bucket),
      color: BUCKET_COLORS[bucket],
    })),
  };
}

export function getBucketBreakdown(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BucketBreakdown {
  const map = categoryBucketMap(categories);
  const totals: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const t of transactions) {
    if (!isSpendingType(t) || !isInMonth(t, monthKey)) continue;
    const b = map.get(t.categoryId);
    if (b) totals[b] += spendingDelta(t);
  }
  const total = totals.needs + totals.wants + totals.savings;
  return {
    ...totals,
    total,
    segments: BUCKETS.map((bucket) => ({
      bucket,
      label: BUCKET_META[bucket].label,
      value: totals[bucket],
      color: BUCKET_COLORS[bucket],
    })),
  };
}

export interface CategorySlice {
  categoryId: number;
  name: string;
  icon: string;
  bucket: Bucket;
  amount: number;
  percent: number; // share of total spending
  color: string;
}

function buildCategorySpendingSlices(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
  bucketFilter?: Bucket
): CategorySlice[] {
  const byCat = new Map<number, number>();
  for (const t of transactions) {
    if (!isSpendingType(t) || !isInMonth(t, monthKey)) continue;
    byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + spendingDelta(t));
  }
  const catById = new Map(categories.map((c) => [c.id!, c]));

  // Total is the denominator for the share-of percents. Exclude orphaned
  // categoryIds (not present in `categories`), and when drilling into a single
  // bucket, only sum categories within that bucket so percents reflect
  // share-of-bucket and sum to ~100%.
  let total = 0;
  for (const [categoryId, amount] of byCat.entries()) {
    const cat = catById.get(categoryId);
    if (!cat) continue;
    if (bucketFilter && cat.bucket !== bucketFilter) continue;
    if (amount <= 0) continue;
    total += amount;
  }

  const slices: CategorySlice[] = [];
  for (const [categoryId, amount] of byCat.entries()) {
    const cat = catById.get(categoryId);
    if (!cat) continue;
    if (bucketFilter && cat.bucket !== bucketFilter) continue;
    if (amount <= 0) continue;
    slices.push({
      categoryId,
      name: cat.name,
      icon: cat.icon,
      bucket: cat.bucket,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
      color: BUCKET_COLORS[cat.bucket],
    });
  }
  slices.sort((a, b) => b.amount - a.amount);
  return slices;
}

export function getTopCategories(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
  limit = 8,
  bucketFilter?: Bucket
): CategorySlice[] {
  return buildCategorySpendingSlices(
    transactions,
    categories,
    monthKey,
    bucketFilter
  ).slice(0, limit);
}

/** All categories with net spending > 0 for the month, sorted by amount descending. */
export function getAllCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): CategorySlice[] {
  return buildCategorySpendingSlices(transactions, categories, monthKey);
}

export interface BudgetVsActualRow {
  bucket: Bucket;
  label: string;
  budget: number;
  spent: number;
  remaining: number;
  over: boolean;
  color: string;
}

export function getBudgetVsActual(
  profile: Profile,
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BudgetVsActualRow[] {
  const map = categoryBucketMap(categories);
  const spent: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const t of transactions) {
    if (!isSpendingType(t) || !isInMonth(t, monthKey)) continue;
    const b = map.get(t.categoryId);
    if (b) spent[b] += spendingDelta(t);
  }
  return BUCKETS.map((bucket) => {
    const budget = bucketLimit(profile, bucket);
    return {
      bucket,
      label: BUCKET_META[bucket].label,
      budget,
      spent: spent[bucket],
      remaining: budget - spent[bucket],
      over: spent[bucket] > budget,
      color: BUCKET_COLORS[bucket],
    };
  });
}

export interface TrendPoint {
  monthKey: string;
  label: string;
  total: number;
  needs: number;
  wants: number;
  savings: number;
}

export function getMonthlyTrend(
  transactions: Transaction[],
  categories: Category[],
  endMonthKey: string,
  months = 6
): TrendPoint[] {
  const map = categoryBucketMap(categories);
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = addMonths(endMonthKey, -i);
    const point: TrendPoint = {
      monthKey: key,
      label: shortMonthLabel(key),
      total: 0,
      needs: 0,
      wants: 0,
      savings: 0,
    };
    for (const t of transactions) {
      if (!isSpendingType(t) || !isInMonth(t, key)) continue;
      const b = map.get(t.categoryId);
      if (b) {
        const delta = spendingDelta(t);
        point[b] += delta;
        point.total += delta;
      }
    }
    points.push(point);
  }
  return points;
}

// ---- Plain-language captions ----
export type CaptionType =
  | "donut"
  | "budgetPlan"
  | "topCategories"
  | "budgetVsActual"
  | "trend";

export function generateChartCaption(
  type: CaptionType,
  data: unknown,
  currency = "USD"
): string {
  switch (type) {
    case "donut": {
      const d = data as BucketBreakdown;
      if (d.total <= 0) return "No spending logged yet for this month.";
      const zeroBuckets = d.segments.filter((s) => s.value === 0);
      const top = [...d.segments].sort((a, b) => b.value - a.value)[0];
      const share = Math.round((top.value / d.total) * 100);
      const main = `Most of your money went to ${top.label} this month (${share}% of spending).`;
      if (zeroBuckets.length === 1 && zeroBuckets[0].bucket === "savings") {
        return `${main} You haven't logged any Savings spending yet.`;
      }
      return main;
    }
    case "budgetPlan": {
      const d = data as BucketBreakdown;
      if (d.total <= 0) {
        return "Set your monthly income in Settings to see your budget plan.";
      }
      return `This is how your ${formatCurrency(d.total, currency)}/month is planned to split.`;
    }
    case "topCategories": {
      const slices = data as CategorySlice[];
      if (!slices.length) return "No spending logged yet for this month.";
      if (slices.length === 1) {
        return `${slices[0].name} was your only expense so far.`;
      }
      return `${slices[0].name} and ${slices[1].name} were your biggest expenses.`;
    }
    case "budgetVsActual": {
      const rows = data as BudgetVsActualRow[];
      const over = rows.filter((r) => r.over);
      if (!rows.some((r) => r.spent > 0)) {
        return "Once you log expenses, you'll see how you're tracking against your budget.";
      }
      if (over.length === 0) {
        return "Nice work — you're within budget in every category.";
      }
      const worst = [...over].sort(
        (a, b) => b.spent - b.budget - (a.spent - a.budget)
      )[0];
      const amount = formatCurrency(worst.spent - worst.budget, currency);
      return `You went ${amount} over on ${worst.label}. The others are on track.`;
    }
    case "trend": {
      const points = data as TrendPoint[];
      const withData = points.filter((p) => p.total > 0);
      if (withData.length < 2) {
        return "Keep logging to see how your spending changes month to month.";
      }
      const last = points[points.length - 1].total;
      const prev = points[points.length - 2].total;
      if (prev === 0) return "This is your first month with spending data.";
      const diff = ((last - prev) / prev) * 100;
      const rounded = Math.round(Math.abs(diff));
      if (rounded < 5) return "Your spending has been fairly steady month to month.";
      return diff > 0
        ? `Your spending is up about ${rounded}% from last month.`
        : `Your spending is down about ${rounded}% from last month. Nice.`;
    }
    default:
      return "";
  }
}
