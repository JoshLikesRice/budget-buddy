import { useMemo, useState } from "react";
import { ensureSeed, updateProfile } from "@/lib/db";
import { useCategories } from "@/hooks/useBudgetData";
import { toMonthlyIncome } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { BUCKET_META, type PayFrequency } from "@/types";
import { BUCKET_COLORS } from "@/lib/charts";
import { BucketDonutChart, DonutLegend } from "@/components/charts/BucketDonutChart";
import { CheckIcon } from "@/components/ui/Icons";

const STEPS = ["Welcome", "Income", "Your split", "Categories"];

export function Onboarding() {
  const categories = useCategories();

  const [step, setStep] = useState(0);
  const [payAmount, setPayAmount] = useState("");
  const [frequency, setFrequency] = useState<PayFrequency>("monthly");
  const [customize, setCustomize] = useState(false);
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [saving, setSaving] = useState(false);

  const monthlyIncome = useMemo(
    () => toMonthlyIncome(parseFloat(payAmount) || 0, frequency),
    [payAmount, frequency]
  );
  const savings = Math.max(0, 100 - needs - wants);
  const percentsValid = needs + wants <= 100;

  const breakdown = useMemo(
    () => ({
      needs: (monthlyIncome * needs) / 100,
      wants: (monthlyIncome * wants) / 100,
      savings: (monthlyIncome * savings) / 100,
      total: monthlyIncome,
      segments: [
        { bucket: "needs" as const, label: "Needs", value: (monthlyIncome * needs) / 100, color: BUCKET_COLORS.needs },
        { bucket: "wants" as const, label: "Wants", value: (monthlyIncome * wants) / 100, color: BUCKET_COLORS.wants },
        { bucket: "savings" as const, label: "Savings", value: (monthlyIncome * savings) / 100, color: BUCKET_COLORS.savings },
      ],
    }),
    [monthlyIncome, needs, wants, savings]
  );

  const finish = async () => {
    setSaving(true);
    await ensureSeed();
    await updateProfile({
      monthlyIncome,
      payFrequency: frequency,
      needsPercent: needs,
      wantsPercent: wants,
      savingsPercent: savings,
      onboardingComplete: true,
    });
    // App.tsx redirects to "/" once the live profile reports onboardingComplete,
    // avoiding a race where an immediate navigate bounces back to /onboarding.
  };

  const canContinue =
    step === 1 ? monthlyIncome > 0 : step === 2 ? percentsValid : true;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-8">
      {/* Progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-blue-600" : i < step ? "w-2 bg-blue-400" : "w-2 bg-slate-200"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="text-center">
            <div className="mb-4 text-6xl">👋</div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome to Budget Buddy</h1>
            <p className="mx-auto mt-3 max-w-sm text-slate-600">
              A budget is just a plan for your money. We'll use the{" "}
              <strong>50/30/20 rule</strong> — a simple, proven split that works
              for most people:
            </p>
            <div className="mt-6 space-y-2 text-left">
              {(["needs", "wants", "savings"] as const).map((b) => (
                <div key={b} className="card flex items-center gap-3 p-3">
                  <span className="text-2xl">{BUCKET_META[b].emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{BUCKET_META[b].label}</p>
                    <p className="text-sm text-slate-500">{BUCKET_META[b].description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">What do you earn?</h1>
            <p className="mt-2 text-slate-600">
              Enter your take-home pay (after taxes). We'll turn it into a monthly
              number for you.
            </p>

            <div className="mt-6">
              <label className="label" htmlFor="pay">
                Take-home pay
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-400">
                  $
                </span>
                <input
                  id="pay"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="3,000"
                  className="input py-3 pl-9 text-2xl font-semibold"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-4">
              <span className="label">How often are you paid?</span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: "monthly", l: "Monthly" },
                    { v: "biweekly", l: "Every 2 weeks" },
                    { v: "weekly", l: "Weekly" },
                  ] as { v: PayFrequency; l: string }[]
                ).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setFrequency(opt.v)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      frequency === opt.v
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {monthlyIncome > 0 && (
              <div className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-center">
                <p className="text-sm text-blue-700">That's about</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(monthlyIncome)} / month
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your money, split up</h1>
            <p className="mt-2 text-slate-600">
              Here's how your {formatCurrency(monthlyIncome)} would be divided each month.
            </p>

            <div className="mt-5">
              <BucketDonutChart breakdown={breakdown} currency="USD" height={200} />
              <DonutLegend breakdown={breakdown} currency="USD" />
            </div>

            <div className="mt-5 space-y-2">
              {(
                [
                  { b: "needs", pct: needs },
                  { b: "wants", pct: wants },
                  { b: "savings", pct: savings },
                ] as const
              ).map(({ b, pct }) => (
                <div key={b} className="card flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: BUCKET_COLORS[b] }}
                    />
                    {BUCKET_META[b].label} · {pct}%
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency((monthlyIncome * pct) / 100)}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCustomize((v) => !v)}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {customize ? "Use the standard 50/30/20" : "Customize my split"}
            </button>

            {customize && (
              <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
                <Slider label="Needs" value={needs} onChange={setNeeds} color={BUCKET_COLORS.needs} />
                <Slider label="Wants" value={wants} onChange={setWants} color={BUCKET_COLORS.wants} />
                <p className="text-sm text-slate-500">
                  Savings is whatever's left:{" "}
                  <strong className="text-slate-700">{savings}%</strong>
                </p>
                {!percentsValid && (
                  <p className="text-sm text-red-600">
                    Needs and Wants together can't be more than 100%.
                  </p>
                )}
                <button
                  onClick={() => {
                    setNeeds(50);
                    setWants(30);
                  }}
                  className="text-sm font-medium text-blue-600"
                >
                  Reset to 50/30/20
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Starter categories</h1>
            <p className="mt-2 text-slate-600">
              We've set up some common categories to get you going. You can add,
              rename, or hide any of them later.
            </p>
            <div className="mt-5 space-y-4">
              {(["needs", "wants", "savings"] as const).map((b) => (
                <div key={b}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: BUCKET_COLORS[b] }}
                    />
                    {BUCKET_META[b].label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter((c) => c.bucket === b)
                      .map((c) => (
                        <span
                          key={c.id}
                          className="chip border border-slate-200 bg-white text-slate-600"
                        >
                          {c.icon} {c.name}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            className="btn-primary ml-auto"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            className="btn-primary ml-auto"
            disabled={saving}
            onClick={finish}
          >
            <CheckIcon width={18} height={18} />
            Looks good, let's go
          </button>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
        style={{ accentColor: color }}
      />
    </div>
  );
}
