import type { Category, Profile } from "@/types";

export const DEFAULT_PROFILE: Omit<Profile, "createdAt"> = {
  id: 1,
  monthlyIncome: 0,
  payFrequency: "monthly",
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
  currency: "USD",
  onboardingComplete: false,
};

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  // Needs
  { name: "Rent / Mortgage", bucket: "needs", icon: "🏠", isDefault: true, archived: false },
  { name: "Groceries", bucket: "needs", icon: "🛒", isDefault: true, archived: false },
  { name: "Utilities", bucket: "needs", icon: "💡", isDefault: true, archived: false },
  { name: "Transportation", bucket: "needs", icon: "🚗", isDefault: true, archived: false },
  { name: "Insurance", bucket: "needs", icon: "🛡️", isDefault: true, archived: false },

  // Wants
  { name: "Dining Out", bucket: "wants", icon: "🍔", isDefault: true, archived: false },
  { name: "Entertainment", bucket: "wants", icon: "🎬", isDefault: true, archived: false },
  { name: "Shopping", bucket: "wants", icon: "🛍️", isDefault: true, archived: false },
  { name: "Subscriptions", bucket: "wants", icon: "📺", isDefault: true, archived: false },
  { name: "Hobbies", bucket: "wants", icon: "🎨", isDefault: true, archived: false },

  // Savings
  { name: "Emergency Fund", bucket: "savings", icon: "🚨", isDefault: true, archived: false },
  { name: "Savings Goal", bucket: "savings", icon: "🎯", isDefault: true, archived: false },
  { name: "Debt Payoff", bucket: "savings", icon: "💳", isDefault: true, archived: false },
];

// A small palette of emojis offered when creating a custom category.
export const CATEGORY_ICON_CHOICES = [
  "💵", "🏠", "🛒", "💡", "🚗", "🛡️", "🍔", "🎬", "🛍️", "📺",
  "🎨", "🚨", "🎯", "💳", "✈️", "🐶", "👶", "💊", "📚", "☕",
  "🎁", "⚽", "💪", "🌟", "📱", "🧾", "🍷", "🏖️",
];
