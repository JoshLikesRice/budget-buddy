import type { CategorySlice } from "@/lib/charts";
import { formatCurrency } from "@/lib/format";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  slices: CategorySlice[];
  currency: string;
  onSelect?: (categoryId: number) => void;
  selectedCategoryId?: number | null;
}

// A lightweight, accessible horizontal bar chart built with divs so the
// labels and amounts stay perfectly readable on small screens.
export function CategoryBarChart({
  slices,
  currency,
  onSelect,
  selectedCategoryId,
}: Props) {
  if (slices.length === 0) {
    return <ChartEmptyState message="No category spending yet this month." height={160} />;
  }

  const max = Math.max(...slices.map((s) => s.amount), 1);

  return (
    <ul className="space-y-3">
      {slices.map((s) => {
        const widthPct = Math.max(4, (s.amount / max) * 100);
        const active = selectedCategoryId == null || selectedCategoryId === s.categoryId;
        return (
          <li key={s.categoryId}>
            <button
              onClick={() => onSelect?.(s.categoryId)}
              className={`group block w-full text-left transition-opacity ${
                active ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span aria-hidden>{s.icon}</span>
                  {s.name}
                </span>
                <span className="tabular-nums text-slate-600">
                  {formatCurrency(s.amount, currency)}
                  <span className="ml-1 text-xs text-slate-400">
                    {Math.round(s.percent)}%
                  </span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 group-hover:brightness-95"
                  style={{ width: `${widthPct}%`, backgroundColor: s.color }}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
