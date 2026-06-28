import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Profile } from "@/types";
import { formatCurrency } from "@/lib/format";
import { getBudgetPlanBreakdown } from "@/lib/charts";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  profile: Profile;
  height?: number;
}

export function BudgetPlanDonutChart({ profile, height = 220 }: Props) {
  const breakdown = useMemo(() => getBudgetPlanBreakdown(profile), [profile]);
  const currency = profile.currency;

  if (breakdown.total <= 0) {
    return <ChartEmptyState height={height} />;
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={breakdown.segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {breakdown.segments.map((seg) => (
              <Cell key={seg.bucket} fill={seg.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Planned
        </span>
        <span className="text-2xl font-bold text-slate-900">
          {formatCurrency(breakdown.total, currency)}
        </span>
      </div>
    </div>
  );
}
