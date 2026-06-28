import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ensureSeed } from "@/lib/db";
import { useProfile } from "@/hooks/useBudgetData";
import { MonthProvider } from "@/context/MonthContext";
import { AddTransactionProvider } from "@/context/AddTransactionContext";
import { Onboarding } from "@/pages/Onboarding";
import { Dashboard } from "@/pages/Dashboard";
import { Spending } from "@/pages/Spending";
import { Transactions } from "@/pages/Transactions";
import { Insights } from "@/pages/Insights";
import { Settings } from "@/pages/Settings";
import { Categories } from "@/pages/Categories";

export default function App() {
  const [seeded, setSeeded] = useState(false);
  const profile = useProfile();
  const location = useLocation();

  useEffect(() => {
    ensureSeed().finally(() => setSeeded(true));
  }, []);

  // Wait for the DB to be ready and the profile to load.
  if (!seeded || profile === undefined) {
    return <LoadingScreen />;
  }

  const onboarded = profile?.onboardingComplete ?? false;

  // Force onboarding until complete.
  if (!onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboarded && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return (
    <MonthProvider>
      <AddTransactionProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/spending" element={<Spending />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AddTransactionProvider>
    </MonthProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 text-slate-400">
      <div className="text-4xl">💰</div>
      <p className="text-sm">Loading Budget Buddy…</p>
    </div>
  );
}
