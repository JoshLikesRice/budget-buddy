import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories, useProfile, useTransactions } from "@/hooks/useBudgetData";
import { useMonth } from "@/context/MonthContext";
import { categoryBucketMap, getMonthlySurplus, isInMonth } from "@/lib/budget";
import {
  generateChartCaption,
  getAllCategorySpending,
  getBucketBreakdown,
  getBudgetPlanBreakdown,
  getBudgetVsActual,
  getMonthlyTrend,
  getTopCategories,
} from "@/lib/charts";
import { BUCKET_META, type Bucket } from "@/types";
import { BucketDonutChart, DonutLegend } from "@/components/charts/BucketDonutChart";
import { BudgetPlanDonutChart } from "@/components/charts/BudgetPlanDonutChart";
import { AllCategoriesBreakdown } from "@/components/charts/AllCategoriesBreakdown";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { BudgetVsActualChart } from "@/components/charts/BudgetVsActualChart";
import { SpendingTrendChart } from "@/components/charts/SpendingTrendChart";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { TransactionList } from "@/components/transactions/TransactionList";
import { formatCurrency } from "@/lib/format";
import { IncomeSurplusBreakdown } from "@/components/dashboard/IncomeSurplusBreakdown";

export function Spending() {
  const profile = useProfile();
  const categories = useCategories(true);
  const transactions = useTransactions();
  const { month } = useMonth();

  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const map = useMemo(() => categoryBucketMap(categories), [categories]);
  const monthTx = useMemo(
    () => transactions.filter((t) => isInMonth(t, month)),
    [transactions, month]
  );

  const breakdown = useMemo(
    () => getBucketBreakdown(transactions, categories, month),
    [transactions, categories, month]
  );
  const planBreakdown = useMemo(
    () => (profile ? getBudgetPlanBreakdown(profile) : null),
    [profile]
  );
  const topCategories = useMemo(
    () => getTopCategories(transactions, categories, month, 8),
    [transactions, categories, month]
  );
  const allCategories = useMemo(
    () => getAllCategorySpending(transactions, categories, month),
    [transactions, categories, month]
  );
  const budgetVsActual = useMemo(
    () => (profile ? getBudgetVsActual(profile, transactions, categories, month) : []),
    [profile, transactions, categories, month]
  );
  const trend = useMemo(
    () => getMonthlyTrend(transactions, categories, month, 6),
    [transactions, categories, month]
  );
  const monthlySurplus = useMemo(
    () => (profile ? getMonthlySurplus(profile, transactions, month) : null),
    [profile, transactions, month]
  );

  // Drill-down categories for the selected bucket.
  const drillCategories = useMemo(
    () =>
      selectedBucket
        ? getTopCategories(transactions, categories, month, 12, selectedBucket)
        : [],
    [selectedBucket, transactions, categories, month]
  );

  // Transactions filtered by the currently selected bucket segment.
  const filteredTx = useMemo(
    () =>
      selectedBucket
        ? monthTx.filter((t) => map.get(t.categoryId) === selectedBucket)
        : [],
    [selectedBucket, monthTx, map]
  );

  if (!profile || !planBreakdown) return null;
  const currency = profile.currency;

  return (
    <AppLayout title="Spending" subtitle="Where did your money go?">
      <div className="space-y-4">
        {/* Your monthly plan — planned 50/30/20 split */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Your monthly plan</h2>
          <BudgetPlanDonutChart profile={profile} />
          <DonutLegend breakdown={planBreakdown} currency={currency} />
          <ChartCaption>
            {generateChartCaption("budgetPlan", planBreakdown, currency)}
          </ChartCaption>
        </section>

        {/* Where it went — actual spending donut */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Where it went</h2>
          <BucketDonutChart
            breakdown={breakdown}
            currency={currency}
            onSelect={(b) => setSelectedBucket((cur) => (cur === b ? null : b))}
            selected={selectedBucket}
          />
          <DonutLegend
            breakdown={breakdown}
            currency={currency}
            onSelect={(b) => setSelectedBucket((cur) => (cur === b ? null : b))}
            selected={selectedBucket}
          />
          <ChartCaption>{generateChartCaption("donut", breakdown, currency)}</ChartCaption>
          {selectedBucket && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Showing {BUCKET_META[selectedBucket].label}. Tap it again to clear.
            </p>
          )}
        </section>

        {/* Drill-down for selected bucket */}
        {selectedBucket && drillCategories.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-3 font-semibold text-slate-800">
              Inside {BUCKET_META[selectedBucket].label}
            </h2>
            <CategoryBarChart slices={drillCategories} currency={currency} />
          </section>
        )}

        {/* 2. Top categories */}
        <section className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-800">Top categories</h2>
          <CategoryBarChart slices={topCategories} currency={currency} />
          <ChartCaption>
            {generateChartCaption("topCategories", topCategories, currency)}
          </ChartCaption>
        </section>

        {/* All categories this month */}
        <section id="all-categories" className="card scroll-mt-4 p-4">
          <h2 className="mb-1 font-semibold text-slate-800">All categories this month</h2>
          <p className="mb-4 text-sm text-slate-500">
            Every category where you logged spending, grouped by Needs, Wants, and Savings.
          </p>
          <AllCategoriesBreakdown slices={allCategories} currency={currency} />
        </section>

        {/* 3. Budget vs actual */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Budget vs. actual</h2>
          <BudgetVsActualChart rows={budgetVsActual} currency={currency} />
          <ChartCaption>
            {generateChartCaption("budgetVsActual", budgetVsActual, currency)}
          </ChartCaption>
          {monthlySurplus && (
            <div className="mt-3 space-y-2">
              <p className="text-center text-sm text-slate-600">
                {monthlySurplus.surplus >= 0 ? (
                  <>
                    After what you've spent, you have{" "}
                    <strong className="text-emerald-700">
                      {formatCurrency(monthlySurplus.surplus, currency)}
                    </strong>{" "}
                    left this month.
                  </>
                ) : (
                  <>
                    You've spent{" "}
                    <strong className="text-amber-700">
                      {formatCurrency(Math.abs(monthlySurplus.surplus), currency)}
                    </strong>{" "}
                    more in spending than income you logged this month.
                  </>
                )}
              </p>
              <IncomeSurplusBreakdown
                loggedIncome={monthlySurplus.loggedIncome}
                netSpent={monthlySurplus.netSpent}
                surplus={monthlySurplus.surplus}
                currency={currency}
                className="mx-auto max-w-xs"
              />
            </div>
          )}
        </section>

        {/* 4. Spending over time */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Spending over time</h2>
          <SpendingTrendChart points={trend} currency={currency} />
          <ChartCaption>{generateChartCaption("trend", trend, currency)}</ChartCaption>
        </section>

        {/* Filtered transaction list tied to selection */}
        {selectedBucket && (
          <section className="card p-4">
            <h2 className="mb-1 font-semibold text-slate-800">
              {BUCKET_META[selectedBucket].label} transactions
            </h2>
            <TransactionList
              transactions={filteredTx}
              categories={categories}
              currency={currency}
              emptyHint={`No ${BUCKET_META[selectedBucket].label} spending this month.`}
            />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
