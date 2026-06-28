import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/charts";
import { BUCKET_COLORS } from "@/lib/charts";
import { formatCurrency } from "@/lib/format";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  points: TrendPoint[];
  currency: string;
  height?: number;
}

export function SpendingTrendChart({ points, currency, height = 240 }: Props) {
  const [split, setSplit] = useState(false);
  const hasData = points.some((p) => p.total > 0);

  if (!hasData) {
    return (
      <ChartEmptyState
        message="After a couple of months, you'll see your spending trend here."
        height={height}
      />
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setSplit((v) => !v)}
          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          {split ? "Show total" : "Split by bucket"}
        </button>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: number) => formatCurrency(v, currency)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lift">
                    <p className="mb-1 font-semibold">{label}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey as string} className="capitalize">
                        {p.dataKey as string}: {formatCurrency(Number(p.value), currency)}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {split ? (
              <>
                <Area
                  type="monotone"
                  dataKey="needs"
                  stackId="1"
                  stroke={BUCKET_COLORS.needs}
                  fill={BUCKET_COLORS.needs}
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="wants"
                  stackId="1"
                  stroke={BUCKET_COLORS.wants}
                  fill={BUCKET_COLORS.wants}
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stackId="1"
                  stroke={BUCKET_COLORS.savings}
                  fill={BUCKET_COLORS.savings}
                  fillOpacity={0.25}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#totalFill)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
