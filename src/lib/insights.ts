import type { Category, Profile, Transaction } from "@/types";
import { BUCKET_META } from "@/types";
import {
  computeAllBuckets,
  getLoggedIncomeThisMonth,
  getMonthlySurplus,
  isInMonth,
  isSpendingType,
} from "./budget";
import { getTopCategories } from "./charts";
import { daysLeftInMonth, formatCurrency, monthKey } from "./format";

export type InsightTone = "positive" | "warning" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  emoji: string;
  message: string;
}

export function buildInsights(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  month: string
): Insight[] {
  const insights: Insight[] = [];
  const currency = profile.currency;
  const buckets = computeAllBuckets(profile, categories, transactions, month);
  const isCurrentMonth = month === monthKey(new Date());
  const daysLeft = daysLeftInMonth(month);
  const monthTx = transactions.filter((t) => isInMonth(t, month));
  const monthSpending = monthTx.filter((t) => isSpendingType(t));

  // No spending activity yet (expenses or paybacks)
  if (monthSpending.length === 0) {
    insights.push({
      id: "empty",
      tone: "info",
      emoji: "👋",
      message:
        "No expenses logged for this month yet. Tap the + button to add your first one — it only takes a few seconds.",
    });
    return insights;
  }

  // Wants pacing
  const wants = buckets.wants;
  if (wants.limit > 0) {
    if (wants.over) {
      insights.push({
        id: "wants-over",
        tone: "warning",
        emoji: "⚠️",
        message: `You're ${formatCurrency(
          Math.abs(wants.remaining),
          currency
        )} over your Wants budget. Try pausing non-essential buys for a bit.`,
      });
    } else if (wants.percentUsed >= 80 && isCurrentMonth) {
      insights.push({
        id: "wants-high",
        tone: "warning",
        emoji: "🟠",
        message: `You've used ${Math.round(
          wants.percentUsed
        )}% of your Wants budget${
          daysLeft > 0 ? ` with ${daysLeft} days left` : ""
        }. Consider holding off on non-essential purchases.`,
      });
    } else if (wants.percentUsed < 60 && isCurrentMonth) {
      insights.push({
        id: "wants-good",
        tone: "positive",
        emoji: "👍",
        message: `Nice pacing on Wants — you still have ${formatCurrency(
          wants.remaining,
          currency
        )} of fun money left.`,
      });
    }
  }

  // Savings funded
  const savings = buckets.savings;
  if (savings.limit > 0 && savings.spent >= savings.limit) {
    insights.push({
      id: "savings-funded",
      tone: "positive",
      emoji: "🌱",
      message: "Great job — your Savings goal is fully funded this month!",
    });
  } else if (savings.limit > 0 && savings.spent === 0 && monthSpending.length > 2) {
    insights.push({
      id: "savings-none",
      tone: "info",
      emoji: "🪙",
      message: `You haven't set aside any Savings yet. Even ${formatCurrency(
        Math.min(savings.limit, 25),
        currency
      )} moved to savings counts.`,
    });
  }

  // Needs over
  const needs = buckets.needs;
  if (needs.over) {
    insights.push({
      id: "needs-over",
      tone: "warning",
      emoji: "🏠",
      message: `Your Needs spending is ${formatCurrency(
        Math.abs(needs.remaining),
        currency
      )} over plan. These are usually fixed — it may be worth revisiting your budget split.`,
    });
  }

  // Top category concentration (chart-aware tip)
  const wantsCats = getTopCategories(transactions, categories, month, 1, "wants");
  if (wantsCats.length && wants.spent > 0) {
    const top = wantsCats[0];
    const shareOfWants = (top.amount / wants.spent) * 100;
    if (shareOfWants >= 40) {
      insights.push({
        id: "wants-concentration",
        tone: "info",
        emoji: "🔎",
        message: `${top.name} is ${Math.round(
          shareOfWants
        )}% of your Wants spending — that's worth keeping an eye on.`,
      });
    }
  }

  // Check-in nudge (only relevant for current month)
  if (isCurrentMonth) {
    const sortedDates = monthTx.map((t) => t.date).sort();
    const lastDate =
      sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : undefined;
    if (lastDate) {
      // Parse "yyyy-MM-dd" as a local date to avoid UTC off-by-one in negative timezones.
      const [ly, lm, ld] = lastDate.split("-").map(Number);
      const lastLocal = new Date(ly, lm - 1, ld);
      const days = Math.floor(
        (Date.now() - lastLocal.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days >= 5) {
        insights.push({
          id: "checkin",
          tone: "info",
          emoji: "📅",
          message: `You haven't logged anything in ${days} days. A quick check-in keeps your budget accurate.`,
        });
      }
    }
  }

  return insights;
}

export interface MonthlyRecap {
  totalSpent: number;
  byBucket: { needs: number; wants: number; savings: number };
  savingsRate: number | null; // savings spent / income (logged, or monthly plan fallback)
  topCategories: ReturnType<typeof getTopCategories>;
  surplus: ReturnType<typeof getMonthlySurplus>;
}

export function buildRecap(
  profile: Profile,
  categories: Category[],
  transactions: Transaction[],
  month: string
): MonthlyRecap {
  const buckets = computeAllBuckets(profile, categories, transactions, month);
  const totalSpent = buckets.needs.spent + buckets.wants.spent + buckets.savings.spent;
  const loggedIncome = getLoggedIncomeThisMonth(transactions, month);
  const incomeDenominator =
    loggedIncome > 0 ? loggedIncome : profile.monthlyIncome;
  const savingsRate =
    incomeDenominator > 0
      ? (buckets.savings.spent / incomeDenominator) * 100
      : null;
  return {
    totalSpent,
    byBucket: {
      needs: buckets.needs.spent,
      wants: buckets.wants.spent,
      savings: buckets.savings.spent,
    },
    savingsRate,
    topCategories: getTopCategories(transactions, categories, month, 5),
    surplus: getMonthlySurplus(profile, transactions, month),
  };
}

export const BUCKET_LABELS = BUCKET_META;
