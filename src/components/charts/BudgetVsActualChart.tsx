import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetVsActualRow } from "@/lib/charts";
import { formatCurrency } from "@/lib/format";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  rows: BudgetVsActualRow[];
  currency: string;
  height?: number;
}

export function BudgetVsActualChart({ rows, currency, height = 240 }: Props) {
  const hasData = rows.some((r) => r.spent > 0 || r.budget > 0);
  if (!hasData) {
    return <ChartEmptyState message="Set your income and log expenses to compare." height={height} />;
  }

  const data = rows.map((r) => ({
    label: r.label,
    budget: Math.round(r.budget),
    spent: Math.round(r.spent),
    over: r.over,
    color: r.color,
  }));

  return (
    <div className="flex flex-col">
      <div className="w-full shrink-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }} barGap={6}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 13 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.12)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-lift">
                  <p className="mb-1 font-semibold">{label}</p>
                  <p>Budget: {formatCurrency(d.budget, currency)}</p>
                  <p>
                    Spent: {formatCurrency(d.spent, currency)}
                    {d.over ? " (over budget)" : ""}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="budget" radius={[6, 6, 0, 0]} fill="#e2e8f0">
            <LabelList
              dataKey="budget"
              position="top"
              formatter={(v: string | number) => formatCurrency(Number(v), currency)}
              style={{ fill: "#94a3b8", fontSize: 11 }}
            />
          </Bar>
          <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.over ? "#f59e0b" : d.color} />
            ))}
            <LabelList
              dataKey="spent"
              position="top"
              formatter={(v: string | number) => formatCurrency(Number(v), currency)}
              style={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Budget
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Spent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Over budget
        </span>
      </div>
    </div>
  );
}
