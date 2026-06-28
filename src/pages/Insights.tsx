import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories, useProfile, useTransactions } from "@/hooks/useBudgetData";
import { useMonth } from "@/context/MonthContext";
import { buildInsights, buildRecap, type InsightTone } from "@/lib/insights";
import { formatCurrency, monthLabel } from "@/lib/format";
import { IncomeSurplusBreakdown } from "@/components/dashboard/IncomeSurplusBreakdown";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { BUCKET_META, BUCKETS } from "@/types";
import { BUCKET_COLORS } from "@/lib/charts";

const toneStyles: Record<InsightTone, string> = {
  positive: "bg-emerald-50 border-emerald-100",
  warning: "bg-amber-50 border-amber-100",
  info: "bg-blue-50 border-blue-100",
};

export function Insights() {
  const profile = useProfile();
  const categories = useCategories(true);
  const transactions = useTransactions();
  const { month } = useMonth();

  const insights = useMemo(
    () => (profile ? buildInsights(profile, categories, transactions, month) : []),
    [profile, categories, transactions, month]
  );
  const recap = useMemo(
    () => (profile ? buildRecap(profile, categories, transactions, month) : null),
    [profile, categories, transactions, month]
  );

  if (!profile || !recap) return null;
  const currency = profile.currency;

  return (
    <AppLayout title="Insights" subtitle="Gentle, judgment-free tips">
      <div className="space-y-4">
        {/* Coaching messages */}
        <div className="space-y-3">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${toneStyles[ins.tone]}`}
            >
              <span className="text-xl" aria-hidden>
                {ins.emoji}
              </span>
              <p className="text-sm text-slate-700">{ins.message}</p>
            </div>
          ))}
        </div>

        {/* Monthly recap */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-800">{monthLabel(month)} recap</h2>
          <p className="mt-1 text-sm text-slate-500">
            You spent{" "}
            <strong className="text-slate-700">
              {formatCurrency(recap.totalSpent, currency)}
            </strong>{" "}
            this month.
          </p>

          {(() => {
            const { surplus, loggedIncome, netSpent } = recap.surplus;
            const isPositive = surplus > 0;
            const isZero = Math.abs(surplus) < 0.005;
            const highlightTone = isZero
              ? "bg-slate-50 text-slate-700"
              : isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700";
            const label = isZero
              ? "Right on track"
              : isPositive
                ? "Monthly surplus"
                : "Spent more than you had";

            return (
              <div className={`mt-3 rounded-xl px-3 py-2 text-center ${highlightTone}`}>
                <p className="text-xs font-medium opacity-80">{label}</p>
                <p className="text-lg font-bold">
                  {isPositive || isZero
                    ? formatCurrency(Math.max(surplus, 0), currency)
                    : `−${formatCurrency(Math.abs(surplus), currency)}`}
                </p>
                <div className="mt-2">
                  <IncomeSurplusBreakdown
                    loggedIncome={loggedIncome}
                    netSpent={netSpent}
                    surplus={surplus}
                    currency={currency}
                  />
                </div>
              </div>
            );
          })()}

          <div className="mt-4 grid grid-cols-3 gap-3">
            {BUCKETS.map((b) => (
              <div key={b} className="rounded-xl bg-slate-50 p-3 text-center">
                <span
                  className="mx-auto mb-1 block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: BUCKET_COLORS[b] }}
                />
                <p className="text-xs text-slate-400">{BUCKET_META[b].label}</p>
                <p className="font-bold text-slate-800">
                  {formatCurrency(recap.byBucket[b], currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-700">Savings rate this month</p>
            <p className="text-2xl font-bold text-emerald-700">
              {recap.savingsRate != null ? `${Math.round(recap.savingsRate)}%` : "N/A"}
            </p>
            <p className="text-xs text-emerald-600/80">
              {recap.savingsRate != null
                ? recap.surplus.loggedIncome > 0
                  ? "of your logged income went to savings"
                  : "of your monthly plan went to savings"
                : "Log income or set a monthly plan to see savings rate"}
            </p>
          </div>

          <h3 className="mb-3 mt-5 text-sm font-semibold text-slate-700">
            Top categories
          </h3>
          <CategoryBarChart slices={recap.topCategories} currency={currency} />
        </div>
      </div>
    </AppLayout>
  );
}
