import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BucketBreakdown } from "@/lib/charts";
import type { Bucket } from "@/types";
import { formatCurrency } from "@/lib/format";
import { ChartEmptyState } from "./ChartEmptyState";

/** Small slice size so zero-spent buckets remain visible in the donut. */
const ZERO_SLICE_FRACTION = 0.02;

interface ChartSlice {
  bucket: Bucket;
  label: string;
  value: number;
  color: string;
  displayValue: number;
  isZero: boolean;
}

function buildChartSlices(
  breakdown: BucketBreakdown,
  alwaysShowBuckets: boolean
): ChartSlice[] {
  const epsilon = breakdown.total * ZERO_SLICE_FRACTION;

  if (alwaysShowBuckets) {
    return breakdown.segments.map((seg) => ({
      ...seg,
      displayValue: seg.value > 0 ? seg.value : epsilon,
      isZero: seg.value === 0,
    }));
  }

  return breakdown.segments
    .filter((seg) => seg.value > 0)
    .map((seg) => ({
      ...seg,
      displayValue: seg.value,
      isZero: false,
    }));
}

function segmentOpacity(
  seg: ChartSlice,
  selected: Bucket | null | undefined
): number {
  if (seg.isZero) return 0.25;
  if (selected && selected !== seg.bucket) return 0.35;
  return 1;
}

interface Props {
  breakdown: BucketBreakdown;
  currency: string;
  height?: number;
  onSelect?: (bucket: Bucket) => void;
  selected?: Bucket | null;
  alwaysShowBuckets?: boolean;
}

export function BucketDonutChart({
  breakdown,
  currency,
  height = 220,
  onSelect,
  selected,
  alwaysShowBuckets = true,
}: Props) {
  if (breakdown.total <= 0) {
    return <ChartEmptyState height={height} />;
  }

  const data = buildChartSlices(breakdown, alwaysShowBuckets);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const seg = payload[0].payload as ChartSlice;
              const share =
                breakdown.total > 0
                  ? Math.round((seg.value / breakdown.total) * 100)
                  : 0;
              return (
                <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lift">
                  <p className="font-semibold">{seg.label}</p>
                  <p>
                    {formatCurrency(seg.value, currency)} · {share}%
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={data}
            dataKey="displayValue"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            onClick={(entry: { bucket?: Bucket }) =>
              entry?.bucket && onSelect?.(entry.bucket)
            }
          >
            {data.map((seg) => (
              <Cell
                key={seg.bucket}
                fill={seg.color}
                opacity={segmentOpacity(seg, selected)}
                cursor={onSelect ? "pointer" : "default"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Spent
        </span>
        <span className="text-2xl font-bold text-slate-900">
          {formatCurrency(breakdown.total, currency)}
        </span>
      </div>
    </div>
  );
}

export function DonutLegend({
  breakdown,
  currency,
  onSelect,
  selected,
  alwaysShowBuckets = true,
}: {
  breakdown: BucketBreakdown;
  currency: string;
  onSelect?: (bucket: Bucket) => void;
  selected?: Bucket | null;
  alwaysShowBuckets?: boolean;
}) {
  const segments = alwaysShowBuckets
    ? breakdown.segments
    : breakdown.segments.filter((seg) => seg.value > 0);

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {segments.map((seg) => {
        const share =
          breakdown.total > 0 ? Math.round((seg.value / breakdown.total) * 100) : 0;
        const active = !selected || selected === seg.bucket;
        const isZero = seg.value === 0;
        return (
          <button
            key={seg.bucket}
            onClick={() => onSelect?.(seg.bucket)}
            className={`flex items-center gap-2 text-sm transition-opacity ${
              active ? "opacity-100" : "opacity-40"
            }`}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: seg.color,
                opacity: isZero ? 0.25 : 1,
              }}
            />
            <span className="font-medium text-slate-700">{seg.label}</span>
            <span className="text-slate-400">
              {formatCurrency(seg.value, currency)} · {share}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
