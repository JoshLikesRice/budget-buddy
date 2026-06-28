import Dexie, { type Table } from "dexie";
import type { Category, Profile, Transaction } from "@/types";
import { DEFAULT_CATEGORIES, DEFAULT_PROFILE } from "./defaults";

export class BudgetDB extends Dexie {
  profile!: Table<Profile, number>;
  categories!: Table<Category, number>;
  transactions!: Table<Transaction, number>;

  constructor() {
    super("budget-buddy");
    this.version(1).stores({
      profile: "id",
      categories: "++id, bucket, archived",
      transactions: "++id, date, categoryId, type",
    });
  }
}

export const db = new BudgetDB();

// Ensures a singleton profile row and seeds default categories on first run.
export async function ensureSeed(): Promise<Profile> {
  let profile = await db.profile.get(1);
  if (!profile) {
    profile = { ...DEFAULT_PROFILE, createdAt: new Date().toISOString() };
    await db.profile.put(profile);
  }
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES as Category[]);
  }
  return profile;
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await db.profile.update(1, patch);
}

// ---- Category helpers ----
export async function addCategory(
  cat: Omit<Category, "id" | "isDefault" | "archived">
): Promise<number> {
  return db.categories.add({ ...cat, isDefault: false, archived: false } as Category);
}

export async function renameCategory(id: number, name: string): Promise<void> {
  await db.categories.update(id, { name });
}

export async function setCategoryArchived(id: number, archived: boolean): Promise<void> {
  await db.categories.update(id, { archived });
}

// ---- Transaction helpers ----
export async function addTransaction(
  tx: Omit<Transaction, "id" | "createdAt">
): Promise<number> {
  return db.transactions.add({
    ...tx,
    amount: Math.abs(tx.amount),
    createdAt: new Date().toISOString(),
  } as Transaction);
}

export async function updateTransaction(
  id: number,
  patch: Partial<Transaction>
): Promise<void> {
  const clean = { ...patch };
  if (typeof clean.amount === "number") clean.amount = Math.abs(clean.amount);
  await db.transactions.update(id, clean);
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.transactions.delete(id);
}

// ---- Backup / restore ----
export interface ExportPayload {
  app: "budget-buddy";
  version: 1;
  exportedAt: string;
  profile: Profile | undefined;
  categories: Category[];
  transactions: Transaction[];
}

export async function exportAll(): Promise<ExportPayload> {
  const [profile, categories, transactions] = await Promise.all([
    db.profile.get(1),
    db.categories.toArray(),
    db.transactions.toArray(),
  ]);
  return {
    app: "budget-buddy",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    categories,
    transactions,
  };
}

export async function importAll(payload: ExportPayload): Promise<void> {
  if (payload.app !== "budget-buddy") {
    throw new Error("This file does not look like a Budget Buddy backup.");
  }
  await db.transaction("rw", db.profile, db.categories, db.transactions, async () => {
    await Promise.all([db.profile.clear(), db.categories.clear(), db.transactions.clear()]);
    if (payload.profile) await db.profile.put(payload.profile);
    if (payload.categories?.length) await db.categories.bulkAdd(payload.categories);
    if (payload.transactions?.length) await db.transactions.bulkAdd(payload.transactions);
  });
  // A backup missing its profile row or categories must not leave the app empty.
  await ensureSeed();
}

export async function resetAll(): Promise<void> {
  await db.transaction("rw", db.profile, db.categories, db.transactions, async () => {
    await Promise.all([db.profile.clear(), db.categories.clear(), db.transactions.clear()]);
  });
  await ensureSeed();
}
