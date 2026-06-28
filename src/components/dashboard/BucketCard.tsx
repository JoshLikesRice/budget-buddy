import type { BucketStatus } from "@/lib/budget";
import { BUCKET_META } from "@/types";
import { formatCurrency } from "@/lib/format";
import { BUCKET_COLORS } from "@/lib/charts";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InfoTooltip } from "@/components/ui/Tooltip";

interface Props {
  status: BucketStatus;
  currency: string;
  daysLeft: number;
}

export function BucketCard({ status, currency, daysLeft }: Props) {
  const meta = BUCKET_META[status.bucket];
  const color = BUCKET_COLORS[status.bucket];

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {meta.emoji}
          </span>
          <span className="font-semibold text-slate-800">{meta.label}</span>
          <InfoTooltip label={meta.label}>{meta.description}</InfoTooltip>
        </div>
        <span
          className="chip"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {Math.round(status.percentUsed)}%
        </span>
      </div>

      <div className="mb-2 flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-slate-900">
          {formatCurrency(status.spent, currency)}
        </span>
        <span className="text-sm text-slate-400">
          of {formatCurrency(status.limit, currency)}
        </span>
      </div>

      <ProgressBar percent={status.percentUsed} color={color} over={status.over} />

      <p className="mt-2 text-xs text-slate-500">
        {status.over ? (
          <span className="font-medium text-amber-600">
            {formatCurrency(Math.abs(status.remaining), currency)} over budget
          </span>
        ) : (
          <>
            {formatCurrency(status.remaining, currency)} left
            {daysLeft > 0 && ` · ${daysLeft} days to go`}
          </>
        )}
      </p>
    </div>
  );
}
