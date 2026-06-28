import { useMemo, useState, type ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories, useProfile, useTransactions } from "@/hooks/useBudgetData";
import { useMonth } from "@/context/MonthContext";
import { useAddTransaction } from "@/context/AddTransactionContext";
import { categoryBucketMap, isInMonth, spendingDelta, isSpendingType } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { TransactionList } from "@/components/transactions/TransactionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/ui/Icons";
import { ImportPdfModal } from "@/components/transactions/ImportPdfModal";
import { ImportSpreadsheetModal } from "@/components/transactions/ImportSpreadsheetModal";
import { BUCKET_META, BUCKETS, type Bucket } from "@/types";
import { BUCKET_COLORS } from "@/lib/charts";

export function Transactions() {
  const profile = useProfile();
  const categories = useCategories(true);
  const transactions = useTransactions();
  const { month } = useMonth();
  const { openAdd } = useAddTransaction();
  const [filter, setFilter] = useState<Bucket | "all">("all");
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [spreadsheetImportOpen, setSpreadsheetImportOpen] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const map = useMemo(() => categoryBucketMap(categories), [categories]);

  const monthTx = useMemo(
    () => transactions.filter((t) => isInMonth(t, month)),
    [transactions, month]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return monthTx;
    return monthTx.filter((t) => map.get(t.categoryId) === filter);
  }, [monthTx, filter, map]);

  const totals = useMemo(() => {
    let spent = 0;
    let income = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      else if (isSpendingType(t)) spent += spendingDelta(t);
    }
    return { spent, income };
  }, [filtered]);

  if (!profile) return null;
  const currency = profile.currency;

  return (
    <AppLayout title="Activity" subtitle="Everything you've logged">
      <div className="space-y-4">
        {importMessage && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {importMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setPdfImportOpen(true)}>
            Import PDF
          </button>
          <button
            className="btn-secondary"
            onClick={() => setSpreadsheetImportOpen(true)}
          >
            Import spreadsheet
          </button>
          <button className="btn-primary" onClick={() => openAdd()}>
            <PlusIcon width={18} height={18} /> Add transaction
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {BUCKETS.map((b) => (
            <FilterChip
              key={b}
              active={filter === b}
              color={BUCKET_COLORS[b]}
              onClick={() => setFilter(b)}
            >
              {BUCKET_META[b].emoji} {BUCKET_META[b].label}
            </FilterChip>
          ))}
        </div>

        {/* Totals summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3">
            <p className="text-xs text-slate-400">Spent</p>
            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(totals.spent, currency)}
            </p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-slate-400">Income logged</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(totals.income, currency)}
            </p>
          </div>
        </div>

        <div className="card p-4">
          {filtered.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="Nothing here yet"
              description="No transactions for this month and filter."
              action={
                <button className="btn-primary" onClick={() => openAdd()}>
                  <PlusIcon width={18} height={18} /> Add transaction
                </button>
              }
            />
          ) : (
            <TransactionList
              transactions={filtered}
              categories={categories}
              currency={currency}
            />
          )}
        </div>
      </div>

      <ImportPdfModal
        open={pdfImportOpen}
        onClose={() => setPdfImportOpen(false)}
        onImported={(count) => {
          setImportMessage(
            `Added ${count} expense${count === 1 ? "" : "s"} from your PDF.`
          );
          setTimeout(() => setImportMessage(""), 3500);
        }}
      />
      <ImportSpreadsheetModal
        open={spreadsheetImportOpen}
        onClose={() => setSpreadsheetImportOpen(false)}
        onImported={(count) => {
          setImportMessage(
            `Added ${count} expense${count === 1 ? "" : "s"} from your spreadsheet.`
          );
          setTimeout(() => setImportMessage(""), 3500);
        }}
      />
    </AppLayout>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip border transition-colors ${
        active
          ? "border-transparent text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
      style={active ? { backgroundColor: color ?? "#2563eb" } : undefined}
    >
      {children}
    </button>
  );
}
