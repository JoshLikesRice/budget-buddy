export type Bucket = "needs" | "wants" | "savings";

export type PayFrequency = "monthly" | "biweekly" | "weekly";

export type TransactionType = "expense" | "income" | "payback";

export interface Profile {
  id: number; // always 1 (singleton)
  monthlyIncome: number;
  payFrequency: PayFrequency;
  needsPercent: number; // e.g. 50
  wantsPercent: number; // e.g. 30
  savingsPercent: number; // e.g. 20
  currency: string; // ISO code, e.g. "USD"
  onboardingComplete: boolean;
  createdAt: string; // ISO date
}

export interface Category {
  id?: number;
  name: string;
  bucket: Bucket;
  icon: string; // emoji
  isDefault: boolean;
  archived: boolean;
}

export interface Transaction {
  id?: number;
  amount: number; // always stored as a positive number
  categoryId: number;
  type: TransactionType;
  date: string; // ISO date (yyyy-MM-dd)
  note: string;
  createdAt: string; // ISO datetime
}

export const BUCKETS: Bucket[] = ["needs", "wants", "savings"];

export const BUCKET_META: Record<
  Bucket,
  { label: string; short: string; description: string; emoji: string }
> = {
  needs: {
    label: "Needs",
    short: "Needs",
    description:
      "Things you must pay for to live and work — rent, groceries, utilities, transport, insurance.",
    emoji: "🏠",
  },
  wants: {
    label: "Wants",
    short: "Wants",
    description:
      "Nice-to-haves that make life fun — dining out, entertainment, shopping, hobbies.",
    emoji: "🎉",
  },
  savings: {
    label: "Savings",
    short: "Savings",
    description:
      "Money you set aside for the future — emergency fund, goals, and paying off debt.",
    emoji: "🌱",
  },
};
