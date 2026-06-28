<<<<<<< HEAD
# Budget Buddy

A friendly, beginner-focused budgeting web app built around the **50/30/20 rule**
(Needs / Wants / Savings). It teaches the method as you use it, with plain-language
guidance and easy-to-read charts that show where your money goes.

Everything is stored **locally on your device** (IndexedDB) — no account, no server,
no data ever leaves your browser.

## Features

- **Guided onboarding** — a 4-step wizard that explains 50/30/20 and sets up your income and split.
- **Dashboard** — a "safe to spend" hero number, three bucket progress cards, and a mini spending donut.
- **Transactions** — quick add/edit/delete, with a gentle (non-blocking) over-budget warning.
- **Spending page** — donut, top-categories bars, budget-vs-actual, and a 6-month trend, each with a plain-English caption. Tap a segment to drill in and filter the transaction list.
- **Insights** — rule-based, encouraging tips plus a monthly recap with a mini chart.
- **Settings** — adjust income, pay frequency, and the 50/30/20 split; manage categories; export/import a JSON backup; reset.
- **Mobile-first** and accessible, with consistent bucket colors (Needs = blue, Wants = amber, Savings = green).

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- React Router
- Recharts
- date-fns

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Other scripts

```bash
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run typecheck  # type-check only
```

## How the budget math works

- Each category belongs to exactly one bucket: **Needs**, **Wants**, or **Savings**.
- `bucket limit = monthly income × bucket %` (50 / 30 / 20 by default).
- `spent` = sum of expenses in that bucket for the selected month.
- The dashboard "safe to spend" highlights your remaining **Wants** money — the most flexible day-to-day spending.

## Your data

- Stored in your browser via IndexedDB under the database name `budget-buddy`.
- Use **Settings → Export backup** to download a JSON file, and **Import backup** to restore it (e.g. on another device or browser).
- **Reset all data** clears everything and restores the starter categories.

## Project structure

```
src/
├── components/   # UI, layout, charts, dashboard, transactions
├── context/      # selected month + global add-transaction modal
├── hooks/        # live IndexedDB queries
├── lib/          # db, budget math, chart aggregation, insights, formatting
├── pages/        # Onboarding, Dashboard, Spending, Transactions, Insights, Categories, Settings
└── types/        # shared types and bucket metadata
```
=======
# budget-buddy
>>>>>>> 41818834aa1a5141d70bb35137a2bc33e176aeb2
