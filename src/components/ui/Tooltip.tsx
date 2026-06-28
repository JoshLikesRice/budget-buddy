import { useState, type ReactNode } from "react";
import { InfoIcon } from "./Icons";

interface InfoTooltipProps {
  label: string;
  children: ReactNode;
}

// Accessible, tap-friendly tooltip used for the inline glossary.
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        aria-label={`What does ${label} mean?`}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <InfoIcon width={15} height={15} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lift"
        >
          {children}
        </span>
      )}
    </span>
  );
}
