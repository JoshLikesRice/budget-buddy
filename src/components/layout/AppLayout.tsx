import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MonthSelector } from "./MonthSelector";

interface Props {
  title: string;
  subtitle?: ReactNode;
  showMonth?: boolean;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, showMonth = true, children }: Props) {
  return (
    <div className="min-h-full pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-slate-50/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {subtitle && (
                <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>
              )}
            </div>
            <span className="text-2xl" aria-hidden>
              💰
            </span>
          </div>
          {showMonth && (
            <div className="mt-3">
              <MonthSelector />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>

      <BottomNav />
    </div>
  );
}
