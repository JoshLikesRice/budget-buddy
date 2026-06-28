import { useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { addTransaction } from "@/lib/db";
import { extractTextFromPdf, looksLikeScannedPdf } from "@/lib/pdfParser";
import { parseExpensesFromText, type ParsedLine } from "@/lib/statementParser";
import { useCategories, useProfile } from "@/hooks/useBudgetData";
import { formatCurrency } from "@/lib/format";
import { BUCKET_META, BUCKETS, type Category } from "@/types";

type Step = "select" | "parsing" | "review";

interface ReviewRow extends ParsedLine {
  id: string;
  selected: boolean;
  categoryId: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: (count: number) => void;
}

function defaultCategoryId(categories: Category[]): number | "" {
  const groceries = categories.find(
    (c) => !c.archived && c.name.toLowerCase() === "groceries"
  );
  if (groceries?.id != null) return groceries.id;

  const firstNeeds = categories.find((c) => !c.archived && c.bucket === "needs");
  if (firstNeeds?.id != null) return firstNeeds.id;

  const first = categories.find((c) => !c.archived);
  return first?.id ?? "";
}

export function ImportPdfModal({ open, onClose, onImported }: Props) {
  const categories = useCategories();
  const profile = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const currency = profile?.currency ?? "USD";

  const [step, setStep] = useState<Step>("select");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [scannedWarning, setScannedWarning] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const grouped = useMemo(
    () =>
      BUCKETS.map((bucket) => ({
        bucket,
        items: categories.filter((c) => c.bucket === bucket),
      })),
    [categories]
  );

  const defaultCatId = useMemo(() => defaultCategoryId(categories), [categories]);

  const reset = () => {
    setStep("select");
    setRows([]);
    setScannedWarning(false);
    setError("");
    setImporting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError("");
    setStep("parsing");
    try {
      const text = await extractTextFromPdf(file);
      setScannedWarning(looksLikeScannedPdf(text));
      const parsed = parseExpensesFromText(text);
      const fallbackId = defaultCatId;
      if (fallbackId === "") {
        setError("Add at least one category before importing expenses.");
        setStep("select");
        return;
      }
      setRows(
        parsed.map((line, index) => ({
          ...line,
          id: `${line.date}-${line.amount}-${index}`,
          selected: true,
          categoryId: fallbackId,
        }))
      );
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read that PDF. Try another file."
      );
      setStep("select");
    }
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const handleImport = async () => {
    const toImport = rows.filter((r) => r.selected);
    if (toImport.length === 0) return;
    setImporting(true);
    try {
      for (const row of toImport) {
        await addTransaction({
          amount: row.amount,
          categoryId: row.categoryId,
          type: "expense",
          date: row.date,
          note: row.description,
        });
      }
      onImported?.(toImport.length);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong while saving."
      );
      setImporting(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import expenses from PDF"
      wide
      footer={
        step === "review" ? (
          <div className="flex items-center gap-3">
            <button className="btn-secondary" onClick={handleClose} disabled={importing}>
              Cancel
            </button>
            <button
              className="btn-primary ml-auto"
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
            >
              {importing
                ? "Importing…"
                : `Import selected (${selectedCount})`}
            </button>
          </div>
        ) : step === "select" ? (
          <div className="flex justify-end">
            <button className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
          </div>
        ) : undefined
      }
    >
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Upload a bank or credit card statement PDF. We&apos;ll find likely
            expenses — you review before anything is saved.
          </p>
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Works best on text-based PDFs. Scanned/image statements may not work
            yet.
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => fileRef.current?.click()}
          >
            Choose PDF file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      {step === "parsing" && (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-700">Parsing your PDF…</p>
          <p className="mt-1 text-sm text-slate-500">This stays on your device.</p>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-3">
          {scannedWarning && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              We couldn&apos;t extract much text from this PDF. It may be a scanned
              image — double-check each row before importing.
            </p>
          )}

          <p className="text-sm font-medium text-slate-700">
            Found {rows.length} possible expense{rows.length === 1 ? "" : "s"}
          </p>

          {rows.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              We couldn&apos;t find any transaction-like lines. Try a different PDF
              or add expenses manually.
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={selectedCount === rows.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                Select all
              </label>
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={row.selected}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, selected: e.target.checked } : r
                            )
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {row.description}
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(row.amount, currency, { withCents: true })}
                          </p>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="sr-only" htmlFor={`date-${row.id}`}>
                              Date
                            </label>
                            <input
                              id={`date-${row.id}`}
                              type="date"
                              className="input py-1.5 text-sm"
                              value={row.date}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, date: e.target.value } : r
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="sr-only" htmlFor={`cat-${row.id}`}>
                              Category
                            </label>
                            <select
                              id={`cat-${row.id}`}
                              className="input py-1.5 text-sm"
                              value={row.categoryId}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, categoryId: Number(e.target.value) }
                                      : r
                                  )
                                )
                              }
                            >
                              {grouped.map((g) => (
                                <optgroup
                                  key={g.bucket}
                                  label={`${BUCKET_META[g.bucket].emoji} ${BUCKET_META[g.bucket].label}`}
                                >
                                  {g.items.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon} {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </div>
                        {row.confidence === "low" && (
                          <p className="mt-1 text-xs text-amber-700">
                            Low confidence — please verify
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
