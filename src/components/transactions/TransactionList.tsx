import { useMemo } from "react";
import type { Category, Transaction } from "@/types";
import { BUCKET_META } from "@/types";
import { formatCurrency } from "@/lib/format";
import { BUCKET_COLORS } from "@/lib/charts";
import { useAddTransaction } from "@/context/AddTransactionContext";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  emptyHint?: string;
}

export function TransactionList({ transactions, categories, currency, emptyHint }: Props) {
  const { openEdit } = useAddTransaction();
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id!, c])),
    [categories]
  );

  if (transactions.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-slate-400">
        {emptyHint ?? "No transactions here yet."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((tx) => {
        const cat = catById.get(tx.categoryId);
        const color = cat ? BUCKET_COLORS[cat.bucket] : "#94a3b8";
        const isIncome = tx.type === "income";
        const isPayback = tx.type === "payback";
        return (
          <li key={tx.id}>
            <button
              onClick={() => openEdit(tx)}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: `${color}1a` }}
                aria-hidden
              >
                {cat?.icon ?? "💸"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-800">
                  {cat?.name ?? "Uncategorized"}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {new Date(tx.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {cat ? ` · ${BUCKET_META[cat.bucket].label}` : ""}
                  {isPayback ? " · Payback" : ""}
                  {tx.note ? ` · ${tx.note}` : ""}
                </span>
              </span>
              <span
                className={`flex-none text-sm font-semibold ${
                  isIncome
                    ? "text-emerald-600"
                    : isPayback
                      ? "text-green-600"
                      : "text-slate-800"
                }`}
              >
                {isIncome || isPayback ? "+" : "−"}
                {formatCurrency(tx.amount, currency, { withCents: true })}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
