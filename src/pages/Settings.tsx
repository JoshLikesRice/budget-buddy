import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useBudgetData";
import {
  exportAll,
  importAll,
  resetAll,
  updateProfile,
  type ExportPayload,
} from "@/lib/db";
import { fromMonthlyIncome, toMonthlyIncome } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { BUCKET_META, type PayFrequency } from "@/types";
import { BUCKET_COLORS } from "@/lib/charts";
import { Modal } from "@/components/ui/Modal";
import { ChevronRight } from "@/components/ui/Icons";
import { ImportPdfModal } from "@/components/transactions/ImportPdfModal";
import { ImportSpreadsheetModal } from "@/components/transactions/ImportSpreadsheetModal";

export function Settings() {
  const profile = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [payAmount, setPayAmount] = useState("");
  const [frequency, setFrequency] = useState<PayFrequency>("monthly");
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [justSaved, setJustSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [spreadsheetImportOpen, setSpreadsheetImportOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      // monthlyIncome is stored as a monthly figure; convert back to the
      // per-paycheck amount for the stored frequency so it round-trips on save.
      setPayAmount(String(fromMonthlyIncome(profile.monthlyIncome, profile.payFrequency)));
      setFrequency(profile.payFrequency);
      setNeeds(profile.needsPercent);
      setWants(profile.wantsPercent);
    }
  }, [profile]);

  if (!profile) return null;
  const currency = profile.currency;
  const savings = Math.max(0, 100 - needs - wants);
  const percentsValid = needs + wants <= 100;
  // When editing income on settings, treat the entered amount with the chosen frequency.
  const previewIncome = toMonthlyIncome(parseFloat(payAmount) || 0, frequency);

  const saveProfile = async () => {
    if (!percentsValid) return;
    await updateProfile({
      monthlyIncome: previewIncome,
      payFrequency: frequency,
      needsPercent: needs,
      wantsPercent: wants,
      savingsPercent: savings,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    setMessage("Saved your changes.");
    setTimeout(() => setMessage(""), 2500);
  };

  const handleExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-buddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ExportPayload;
      await importAll(payload);
      setMessage("Backup restored successfully.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not read that backup file."
      );
    }
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <AppLayout title="Settings" subtitle="Income, budget split, and your data" showMonth={false}>
      <div className="space-y-4">
        {message && (
          <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            {message}
          </p>
        )}

        {/* Income */}
        <section className="card p-4">
          <h2 className="mb-3 font-semibold text-slate-800">Income</h2>
          <label className="label" htmlFor="income">
            Take-home pay
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
              $
            </span>
            <input
              id="income"
              type="number"
              min="0"
              className="input pl-8 text-lg font-semibold"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { v: "monthly", l: "Monthly" },
                { v: "biweekly", l: "Every 2 wks" },
                { v: "weekly", l: "Weekly" },
              ] as { v: PayFrequency; l: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFrequency(opt.v)}
                className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                  frequency === opt.v
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
          {previewIncome > 0 && (
            <p className="mt-3 text-sm text-slate-500">
              Monthly budget base:{" "}
              <strong className="text-slate-700">
                {formatCurrency(previewIncome, currency)}
              </strong>
            </p>
          )}
        </section>

        {/* Budget split */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Budget split</h2>
          <p className="mb-3 text-sm text-slate-500">
            The classic rule is 50/30/20, but you can adjust it.
          </p>

          <SettingSlider label="Needs" value={needs} onChange={setNeeds} color={BUCKET_COLORS.needs} amount={(previewIncome * needs) / 100} currency={currency} />
          <SettingSlider label="Wants" value={wants} onChange={setWants} color={BUCKET_COLORS.wants} amount={(previewIncome * wants) / 100} currency={currency} />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: BUCKET_COLORS.savings }}
              />
              {BUCKET_META.savings.label} · {savings}%
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {formatCurrency((previewIncome * savings) / 100, currency)}
            </span>
          </div>

          {!percentsValid && (
            <p className="mt-3 text-sm text-red-600">
              Needs and Wants together can't be more than 100%.
            </p>
          )}

          <button
            className="btn-primary mt-4 w-full"
            disabled={!percentsValid}
            onClick={saveProfile}
          >
            {justSaved ? "Saved ✓" : "Save changes"}
          </button>
        </section>

        {/* Categories link */}
        <Link
          to="/categories"
          className="card flex items-center justify-between p-4 transition-colors hover:bg-slate-50"
        >
          <div>
            <p className="font-semibold text-slate-800">Manage categories</p>
            <p className="text-sm text-slate-500">Add, rename, or hide categories</p>
          </div>
          <ChevronRight width={20} height={20} className="text-slate-400" />
        </Link>

        {/* Data */}
        <section className="card p-4">
          <h2 className="mb-1 font-semibold text-slate-800">Your data</h2>
          <p className="mb-3 text-sm text-slate-500">
            Everything is stored privately on this device. Back it up or move it
            to another device with a file.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={handleExport}>
              Export backup
            </button>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              Import backup
            </button>
          </div>
          <button
            className="btn-secondary mt-2 w-full"
            onClick={() => setPdfImportOpen(true)}
          >
            Import expenses from PDF
          </button>
          <button
            className="btn-secondary mt-2 w-full"
            onClick={() => setSpreadsheetImportOpen(true)}
          >
            Import expenses from spreadsheet
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <button
            className="btn-ghost mt-3 w-full text-red-600 hover:bg-red-50"
            onClick={() => setShowReset(true)}
          >
            Reset all data
          </button>
        </section>

        <p className="pb-2 text-center text-xs text-slate-400">
          Budget Buddy · your data never leaves this device
        </p>
      </div>

      <ImportPdfModal
        open={pdfImportOpen}
        onClose={() => setPdfImportOpen(false)}
        onImported={(count) => {
          setMessage(
            `Added ${count} expense${count === 1 ? "" : "s"} from your PDF.`
          );
          setTimeout(() => setMessage(""), 3500);
        }}
      />
      <ImportSpreadsheetModal
        open={spreadsheetImportOpen}
        onClose={() => setSpreadsheetImportOpen(false)}
        onImported={(count) => {
          setMessage(
            `Added ${count} expense${count === 1 ? "" : "s"} from your spreadsheet.`
          );
          setTimeout(() => setMessage(""), 3500);
        }}
      />

      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title="Reset everything?"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowReset(false)}>
              Keep my data
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                await resetAll();
                setShowReset(false);
                setMessage("All data was reset to defaults.");
                setTimeout(() => setMessage(""), 3000);
              }}
            >
              Yes, reset
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          This permanently deletes all your transactions and custom categories on
          this device, and restores the starter categories. Consider exporting a
          backup first. This can't be undone.
        </p>
      </Modal>
    </AppLayout>
  );
}

function SettingSlider({
  label,
  value,
  onChange,
  color,
  amount,
  currency,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  amount: number;
  currency: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          {label} · {value}%
        </span>
        <span className="font-semibold text-slate-800">
          {formatCurrency(amount, currency)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}
