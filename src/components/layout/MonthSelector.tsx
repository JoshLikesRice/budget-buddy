import { useMonth } from "@/context/MonthContext";
import { addMonths, monthKey, monthLabel } from "@/lib/format";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icons";

export function MonthSelector() {
  const { month, setMonth } = useMonth();
  const isCurrent = month === monthKey(new Date());

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className="btn-ghost h-9 w-9 rounded-full p-0"
        onClick={() => setMonth(addMonths(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft width={20} height={20} />
      </button>
      <button
        className="min-w-[10rem] rounded-xl px-3 py-1.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:hover:bg-transparent"
        onClick={() => setMonth(monthKey(new Date()))}
        disabled={isCurrent}
        title={isCurrent ? "This is the current month" : "Jump to this month"}
      >
        {monthLabel(month)}
        {!isCurrent && (
          <span className="ml-1 text-xs font-normal text-blue-500">· today</span>
        )}
      </button>
      <button
        className="btn-ghost h-9 w-9 rounded-full p-0"
        onClick={() => setMonth(addMonths(month, 1))}
        aria-label="Next month"
      >
        <ChevronRight width={20} height={20} />
      </button>
    </div>
  );
}
