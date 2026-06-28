import { createContext, useContext, useState, type ReactNode } from "react";
import type { Transaction } from "@/types";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

interface AddTransactionContextValue {
  openAdd: (presetCategoryId?: number) => void;
  openEdit: (tx: Transaction) => void;
}

const Ctx = createContext<AddTransactionContextValue | null>(null);

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [presetCategoryId, setPresetCategoryId] = useState<number | undefined>();

  const openAdd = (categoryId?: number) => {
    setEditing(null);
    setPresetCategoryId(categoryId);
    setOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setPresetCategoryId(undefined);
    setOpen(true);
  };

  return (
    <Ctx.Provider value={{ openAdd, openEdit }}>
      {children}
      <AddTransactionModal
        open={open}
        editing={editing}
        presetCategoryId={presetCategoryId}
        onClose={() => setOpen(false)}
      />
    </Ctx.Provider>
  );
}

export function useAddTransaction(): AddTransactionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAddTransaction must be used within AddTransactionProvider");
  return ctx;
}
