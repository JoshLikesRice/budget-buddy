import type { MonthlySurplus } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { IncomeSurplusBreakdown } from "@/components/dashboard/IncomeSurplusBreakdown";

interface Props {
  surplus: MonthlySurplus;
  currency: string;
  headroom?: number;
}

export function MonthlySurplusCard({ surplus, currency, headroom }: Props) {
  const { loggedIncome, netSpent, surplus: amount } = surplus;
  const isPositive = amount > 0;
  const isZero = Math.abs(amount) < 0.005;

  const tone = isZero
    ? "border-slate-200 bg-slate-50"
    : isPositive
      ? "border-emerald-100 bg-emerald-50"
      : "border-amber-100 bg-amber-50";

  const amountColor = isZero
    ? "text-slate-800"
    : isPositive
      ? "text-emerald-700"
      : "text-amber-700";

  const message = isZero
    ? "You're right on track with your spending."
    : isPositive
      ? `You have ${formatCurrency(amount, currency)} left after what you've logged this month. Great chance to boost Savings!`
      : `You've logged ${formatCurrency(Math.abs(amount), currency)} more in spending than income this month.`;

  return (
    <div className={`card border p-4 ${tone}`}>
      <h2 className="font-semibold text-slate-800">This month's surplus</h2>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${amountColor}`}>
        {isPositive || isZero
          ? formatCurrency(Math.max(amount, 0), currency)
          : `−${formatCurrency(Math.abs(amount), currency)}`}
      </p>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-2">
        <IncomeSurplusBreakdown
          loggedIncome={loggedIncome}
          netSpent={netSpent}
          surplus={amount}
          currency={currency}
        />
      </div>
      {headroom != null && headroom > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Budget headroom: {formatCurrency(headroom, currency)} unused across your buckets
        </p>
      )}
    </div>
  );
}
