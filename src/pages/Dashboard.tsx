import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories, useProfile, useTransactions } from "@/hooks/useBudgetData";
import { useMonth } from "@/context/MonthContext";
import { useAddTransaction } from "@/context/AddTransactionContext";
import { computeAllBuckets, getBudgetHeadroom, getMonthlySurplus, isInMonth } from "@/lib/budget";
import { getBucketBreakdown, getBudgetPlanBreakdown, generateChartCaption } from "@/lib/charts";
import { daysLeftInMonth } from "@/lib/format";
import { SafeToSpendCard } from "@/components/dashboard/SafeToSpendCard";
import { MonthlySurplusCard } from "@/components/dashboard/MonthlySurplusCard";
import { IncomeSurplusBreakdown } from "@/components/dashboard/IncomeSurplusBreakdown";
import { BucketCard } from "@/components/dashboard/BucketCard";
import { BucketDonutChart, DonutLegend } from "@/components/charts/BucketDonutChart";
import { BudgetPlanDonutChart } from "@/components/charts/BudgetPlanDonutChart";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { TransactionList } from "@/components/transactions/TransactionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/ui/Icons";
import { BUCKETS } from "@/types";

export function Dashboard() {
  const profile = useProfile();
  const categories = useCategories(true);
  const transactions = useTransactions();
  const { month } = useMonth();
  const { openAdd } = useAddTransaction();

  const buckets = useMemo(
    () => (profile ? computeAllBuckets(profile, categories, transactions, month) : null),
    [profile, categories, transactions, month]
  );
  const breakdown = useMemo(
    () => getBucketBreakdown(transactions, categories, month),
    [transactions, categories, month]
  );
  const planBreakdown = useMemo(
    () => (profile ? getBudgetPlanBreakdown(profile) : null),
    [profile]
  );
  const monthlySurplus = useMemo(
    () => (profile ? getMonthlySurplus(profile, transactions, month) : null),
    [profile, transactions, month]
  );
  const budgetHeadroom = useMemo(
    () =>
      profile ? getBudgetHeadroom(profile, categories, transactions, month) : 0,
    [profile, categories, transactions, month]
  );
  const monthTx = useMemo(
    () => transactions.filter((t) => isInMonth(t, month)),
    [transactions, month]
  );
  const recent = monthTx.slice(0, 5);
  const daysLeft = daysLeftInMonth(month);

  if (!profile || !buckets || !planBreakdown || !monthlySurplus) return null;
  const currency = profile.currency;

  const incomeSubtitle = (
    <IncomeSurplusBreakdown
      loggedIncome={monthlySurplus.loggedIncome}
      netSpent={monthlySurplus.netSpent}
      surplus={monthlySurplus.surplus}
      currency={currency}
      compact
    />
  );

  return (
    <AppLayout
      title="Your money"
      subtitle={incomeSubtitle}
    >
      <div className="space-y-4">
        <SafeToSpendCard wants={buckets.wants} currency={currency} daysLeft={daysLeft} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BUCKETS.map((b) => (
            <BucketCard key={b} status={buckets[b]} currency={currency} daysLeft={daysLeft} />
          ))}
        </div>

        <MonthlySurplusCard
          surplus={monthlySurplus}
          currency={currency}
          headroom={budgetHeadroom}
        />

        {/* Plan vs actual spending snapshot */}
        <div className="card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Your budget at a glance</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/spending#all-categories"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                See all categories →
              </Link>
              <Link
                to="/spending"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                See full breakdown →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-600">Your monthly plan</h3>
              <BudgetPlanDonutChart profile={profile} height={180} />
              <DonutLegend breakdown={planBreakdown} currency={currency} />
              <ChartCaption>
                {generateChartCaption("budgetPlan", planBreakdown, currency)}
              </ChartCaption>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-600">This month's spending</h3>
              {breakdown.total > 0 ? (
                <>
                  <BucketDonutChart breakdown={breakdown} currency={currency} height={180} />
                  <DonutLegend breakdown={breakdown} currency={currency} />
                </>
              ) : (
                <EmptyState
                  emoji="🧾"
                  title="No spending yet this month"
                  description="Log your first expense and your spending picture appears here."
                  action={
                    <button className="btn-primary" onClick={() => openAdd()}>
                      <PlusIcon width={18} height={18} /> Add expense
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent activity</h2>
            <Link
              to="/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
          <TransactionList
            transactions={recent}
            categories={categories}
            currency={currency}
            emptyHint="Nothing logged this month yet — tap + to add your first expense."
          />
        </div>
      </div>
    </AppLayout>
  );
}
