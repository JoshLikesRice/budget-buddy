import { formatCurrency } from "@/lib/format";
import type { BucketStatus } from "@/lib/budget";

interface Props {
  wants: BucketStatus;
  currency: string;
  daysLeft: number;
}

// The hero card: how much flexible "fun money" is left this month.
export function SafeToSpendCard({ wants, currency, daysLeft }: Props) {
  const remaining = wants.remaining;
  const healthy = wants.percentUsed <= 80 && remaining > 0;
  const over = remaining < 0;

  const tone = over
    ? "from-amber-500 to-amber-600"
    : healthy
      ? "from-blue-600 to-indigo-600"
      : "from-amber-400 to-amber-500";

  const perDay = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${tone} p-5 text-white shadow-lift`}
    >
      <p className="text-sm font-medium text-white/80">
        Safe to spend on Wants
      </p>
      <p className="mt-1 text-4xl font-bold tracking-tight">
        {formatCurrency(Math.max(remaining, 0), currency)}
      </p>
      <p className="mt-2 text-sm text-white/85">
        {over ? (
          <>You're {formatCurrency(Math.abs(remaining), currency)} over your Wants budget this month.</>
        ) : perDay ? (
          <>That's about {formatCurrency(perDay, currency)} a day for the rest of the month.</>
        ) : (
          <>This is your flexible fun money for the month.</>
        )}
      </p>
    </div>
  );
}
