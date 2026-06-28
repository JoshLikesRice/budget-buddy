import { formatCurrency } from "@/lib/format";

const EPS = 0.005;

interface Props {
  loggedIncome: number;
  netSpent: number;
  surplus: number;
  currency: string;
  className?: string;
  /** Tighter spacing for header subtitles */
  compact?: boolean;
}

interface Row {
  label: string;
  value: string;
  emphasized?: boolean;
}

export function IncomeSurplusBreakdown({
  loggedIncome,
  netSpent,
  surplus,
  currency,
  className = "",
  compact = false,
}: Props) {
  const isOver = surplus < -EPS;

  const rows: Row[] = [
    {
      label: "Income logged this month",
      value: formatCurrency(loggedIncome, currency),
    },
    { label: "Spent this month", value: formatCurrency(netSpent, currency) },
    {
      label: isOver ? "Over by" : "Left over",
      value: isOver
        ? formatCurrency(Math.abs(surplus), currency)
        : formatCurrency(Math.max(surplus, 0), currency),
      emphasized: true,
    },
  ];

  return (
    <dl
      className={`${compact ? "space-y-0" : "space-y-0.5"} text-xs ${className}`}
    >
      {rows.map(({ label, value, emphasized }) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-slate-500">{label}</dt>
          <dd className={emphasized ? "font-medium text-slate-700" : "text-slate-600"}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
