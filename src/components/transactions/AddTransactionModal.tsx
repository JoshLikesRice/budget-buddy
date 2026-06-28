import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/db";
import {
  useCategories,
  useProfile,
  useTransactions,
} from "@/hooks/useBudgetData";
import {
  computeBucketStatus,
} from "@/lib/budget";
import { formatCurrency, monthKey, todayISO } from "@/lib/format";
import { BUCKET_META, BUCKETS, type Transaction, type TransactionType } from "@/types";

interface Props {
  open: boolean;
  editing: Transaction | null;
  presetCategoryId?: number;
  onClose: () => void;
}

export function AddTransactionModal({ open, editing, presetCategoryId, onClose }: Props) {
  const categories = useCategories();
  const allCategories = useCategories(true);
  const profile = useProfile();
  const transactions = useTransactions();
  const currency = profile?.currency ?? "USD";

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Reset the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setDate(editing.date);
      setNote(editing.note);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId(presetCategoryId ?? "");
      setDate(todayISO());
      setNote("");
    }
    setError("");
  }, [open, editing, presetCategoryId]);

  const grouped = useMemo(
    () =>
      BUCKETS.map((bucket) => ({
        bucket,
        items: categories.filter((c) => c.bucket === bucket),
      })),
    [categories]
  );

  // Gentle over-budget warning (does not block saving).
  const warning = useMemo(() => {
    if (type !== "expense" || categoryId === "" || !profile) return "";
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return "";
    const cat = allCategories.find((c) => c.id === categoryId);
    if (!cat) return "";
    const status = computeBucketStatus(
      profile,
      allCategories,
      transactions.filter((t) => t.id !== editing?.id),
      monthKey(new Date(date)),
      cat.bucket
    );
    const projected = status.spent + amt;
    if (status.limit > 0 && projected > status.limit) {
      const over = projected - status.limit;
      return `Heads up: this puts your ${BUCKET_META[cat.bucket].label} bucket ${formatCurrency(
        over,
        currency
      )} over budget. You can still save it.`;
    }
    return "";
  }, [type, categoryId, amount, date, profile, allCategories, transactions, editing, currency]);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (categoryId === "") {
      setError("Pick a category so we know where this belongs.");
      return;
    }
    const payload = {
      amount: amt,
      categoryId: Number(categoryId),
      type,
      date,
      note: note.trim(),
    };
    if (editing?.id != null) {
      await updateTransaction(editing.id, payload);
    } else {
      await addTransaction(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (editing?.id != null) {
      await deleteTransaction(editing.id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add a transaction"}
      footer={
        <div className="flex items-center gap-3">
          {editing && (
            <button className="btn-ghost text-red-600" onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {editing ? "Save changes" : "Add it"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
          {(["expense", "income", "payback"] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                type === t ? "bg-white text-slate-900 shadow-card" : "text-slate-500"
              }`}
            >
              {t === "expense" ? "Expense" : t === "income" ? "Income" : "Payback"}
            </button>
          ))}
        </div>

        {type === "payback" && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            Use this for refunds or money returned — it lowers your spending in this category
            without counting as income.
          </p>
        )}

        {/* Amount */}
        <div>
          <label className="label" htmlFor="tx-amount">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-400">
              $
            </span>
            <input
              id="tx-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input py-3 pl-9 text-2xl font-semibold"
              autoFocus
            />
          </div>
        </div>

        {/* Category (only meaningful for expenses, but allowed for income too) */}
        <div>
          <label className="label" htmlFor="tx-category">
            Category
          </label>
          <select
            id="tx-category"
            className="input"
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Choose a category…</option>
            {grouped.map((g) => (
              <optgroup key={g.bucket} label={`${BUCKET_META[g.bucket].emoji} ${BUCKET_META[g.bucket].label}`}>
                {g.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Date + note */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tx-date">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="tx-note">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="tx-note"
              type="text"
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. weekly shop"
            />
          </div>
        </div>

        {warning && (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
            {warning}
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    </Modal>
  );
}
