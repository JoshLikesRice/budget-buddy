import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Category, Profile, Transaction } from "@/types";

export function useProfile(): Profile | undefined {
  return useLiveQuery(() => db.profile.get(1), []);
}

export function useCategories(includeArchived = false): Category[] {
  return (
    useLiveQuery(async () => {
      const all = await db.categories.toArray();
      const filtered = includeArchived ? all : all.filter((c) => !c.archived);
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [includeArchived]) ?? []
  );
}

export function useTransactions(): Transaction[] {
  return (
    useLiveQuery(async () => {
      const all = await db.transactions.toArray();
      // Newest first by date, then by creation time
      return all.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    }, []) ?? []
  );
}
