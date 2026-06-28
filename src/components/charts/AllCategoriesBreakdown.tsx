import { useMemo } from "react";
import { BUCKET_COLORS, type CategorySlice } from "@/lib/charts";
import { formatCurrency } from "@/lib/format";
import { BUCKET_META, BUCKETS, type Bucket } from "@/types";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  slices: CategorySlice[];
  currency: string;
}

function BucketChip({ bucket }: { bucket: Bucket }) {
  const color = BUCKET_COLORS[bucket];
  const meta = BUCKET_META[bucket];
  return (
    <span className="chip flex-none" style={{ backgroundColor: `${color}1a`, color }}>
      {meta.short}
    </span>
  );
}

function CategoryRow({ slice, currency, maxAmount }: { slice: CategorySlice; currency: string; maxAmount: number }) {
  const widthPct = Math.max(4, (slice.amount / maxAmount) * 100);

  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
          <span aria-hidden className="flex-none text-base">
            {slice.icon}
          </span>
          <span className="truncate">{slice.name}</span>
          <BucketChip bucket={slice.bucket} />
        </span>
        <span className="flex-none tabular-nums text-slate-600">
          {formatCurrency(slice.amount, currency)}
          <span className="ml-1 text-xs text-slate-400">{Math.round(slice.percent)}%</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${widthPct}%`, backgroundColor: slice.color }}
        />
      </div>
    </li>
  );
}

export function AllCategoriesBreakdown({ slices, currency }: Props) {
  const maxAmount = useMemo(
    () => Math.max(...slices.map((s) => s.amount), 1),
    [slices]
  );

  const byBucket = useMemo(() => {
    const grouped = new Map<Bucket, CategorySlice[]>();
    for (const bucket of BUCKETS) grouped.set(bucket, []);
    for (const slice of slices) {
      grouped.get(slice.bucket)?.push(slice);
    }
    return grouped;
  }, [slices]);

  if (slices.length === 0) {
    return (
      <ChartEmptyState message="No category spending yet this month." height={160} />
    );
  }

  const bucketsWithData = BUCKETS.filter((b) => (byBucket.get(b)?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      {bucketsWithData.map((bucket) => {
        const bucketSlices = byBucket.get(bucket)!;
        const meta = BUCKET_META[bucket];
        const color = BUCKET_COLORS[bucket];
        const bucketTotal = bucketSlices.reduce((sum, s) => sum + s.amount, 0);

        return (
          <section key={bucket}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span aria-hidden>{meta.emoji}</span>
                {meta.label}
              </h3>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color }}
              >
                {formatCurrency(bucketTotal, currency)}
              </span>
            </div>
            <ul className="space-y-3">
              {bucketSlices.map((slice) => (
                <CategoryRow
                  key={slice.categoryId}
                  slice={slice}
                  currency={currency}
                  maxAmount={maxAmount}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
