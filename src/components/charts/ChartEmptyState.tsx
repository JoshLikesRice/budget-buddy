interface Props {
  message?: string;
  height?: number;
}

// A faded placeholder shown when a chart has no data for the month.
export function ChartEmptyState({
  message = "Log a few expenses to see your spending picture.",
  height = 180,
}: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-center"
      style={{ height }}
    >
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden className="opacity-40">
        <circle
          cx="48"
          cy="48"
          r="34"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="14"
          strokeDasharray="6 8"
        />
        <circle cx="48" cy="48" r="20" fill="#f1f5f9" />
      </svg>
      <p className="max-w-[14rem] text-sm text-slate-400">{message}</p>
    </div>
  );
}
