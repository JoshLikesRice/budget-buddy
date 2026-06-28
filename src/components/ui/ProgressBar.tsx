interface ProgressBarProps {
  percent: number; // 0-100+
  color: string;
  over?: boolean;
  className?: string;
}

export function ProgressBar({ percent, color, over, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: over ? "#f59e0b" : color,
        }}
      />
    </div>
  );
}
