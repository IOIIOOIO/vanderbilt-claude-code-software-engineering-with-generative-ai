# Exercise 1 — Expense Tracker ("Spendwise")

## The prompt

> Create a modern, professional NextJS expense tracking application… add expenses with date,
> amount, category and description; list, search and filter them by date range and category;
> a dashboard with summary cards and basic charts; CSV export; edit and delete; localStorage
> persistence. NextJS 14 App Router, TypeScript, Tailwind, responsive, form validation, date
> picker, currency formatting, loading states and error handling.

## What was built

| Requirement | Where |
| --- | --- |
| Add / edit expenses with validation | `src/components/ExpenseForm.tsx`, `src/lib/validation.ts` |
| Delete with **Undo** toast | `src/components/AppShell.tsx` |
| List, search, category and date-range filters | `src/app/expenses/page.tsx`, `src/components/FilterBar.tsx` |
| Dashboard summary cards (total, this month vs last, average, top category) | `src/components/SummaryCards.tsx` |
| Charts: category donut + 6-month bar chart (plain SVG/CSS, no chart library) | `src/components/Charts.tsx` |
| CSV export of the filtered list | `src/lib/csv.ts` |
| localStorage persistence (+ sync across tabs) | `src/lib/storage.ts`, `src/hooks/useExpenses.tsx` |
| Loading skeletons, empty states, error banner, toasts | `src/components/States.tsx`, `src/hooks/useToast.tsx` |

**Design decisions**

- **State:** a React Context provider (`useExpenses`) owns the expense list and writes to
  localStorage on every change. Hooks only, no external state library.
- **Pure logic in `src/lib`:** validation, filtering, analytics and CSV have no React in them, so
  they're unit-tested directly.
- **Dates** are stored as `YYYY-MM-DD` strings rather than `Date` objects, so they don't shift
  across time zones. Amounts are rounded to cents.
- **Date picker:** the native `<input type="date">`. It's accessible, works well on mobile and
  needs no dependency.
- **CSV safety:** commas and quotes are escaped. Cells that start with `=`, `+`, `-` or `@` are
  prefixed with `'` so a spreadsheet won't run them as formulas.
- **Responsive:** a table on desktop, stacked cards on mobile. The add/edit modal opens as a
  bottom sheet on phones.

## Data export, version 3 (branch `feature-data-export-v3`)

A **Share & Sync** page at `/share`, designed like a SaaS integrations hub. It has four tabs:
**Export & share**, **Integrations**, **Automations** and **Activity**.

- **Templates:** Tax Report (year to date, with subtotals by category), Monthly Summary (a
  12-month table of months against categories), Category Analysis (count, total, average, share
  and largest expense) and Full Backup (JSON you could restore from). All are built from real
  data and covered by unit tests.
- **Destinations:** Download, Email, Google Sheets, Google Drive, Dropbox, OneDrive, Notion,
  Slack and Webhook. Services that need an account go through a simulated sign-in: a "redirecting"
  screen, then a consent screen listing what Spendwise could access.
- **Background tasks:** a floating panel shows each export moving through its stages, such as
  Generating, Uploading and Verifying, then completing or failing.
- **Google Sheets mockup:** finishing an export opens a spreadsheet-style window filled with the
  data that would be written.
- **Email:** recipients as removable chips with address checking, plus a subject, a message, an
  attachment preview and a delivery confirmation.
- **Share links and QR codes:** these actually work. The report is compressed and stored in the
  part of the URL after `#`, which browsers never send to a server. The `/shared` page shows a
  read-only view of it, with an expiry date, a note and a CSV download.
- **Automations:** daily, weekly or monthly exports with a plain-English summary, the next run
  time, pause and resume, and **Run now**. Runs missed while the app was closed happen on your
  next visit.
- **Auto-sync:** a storage service can keep a backup that updates a few seconds after each edit.
  The nav shows the status: Local only, Syncing…, Synced 2m ago or Offline.
- **Activity history:** a timeline that is saved between visits, with filters, a success rate,
  the total data sent, re-run and retry buttons, and **Open sheet**.
- **Backup health:** a warning appears when your data has never been backed up, with a link to
  schedule backups.
- **Offline:** exports to online services fail cleanly with a "You're offline" message, and the
  tabs still work offline.

**How it's built:**
- `src/lib/cloud/` holds the templates, the destination list, the schedule maths and the
  share-link encoding. None of it uses React, and it's covered by unit tests.
- `src/hooks/useCloud.tsx` runs the export jobs, the scheduler and auto-sync.
- The integrations are simulated: nothing leaves the browser except through share links you
  create.

## Run it

Requires Node 18.17+.

```bash
cd module-1/exercise-01-expense-tracker
npm install
npm run dev          # http://localhost:3000
```

Production build: `npm run build && npm start`.

Checks: `npm test` (unit tests), `npm run typecheck`, `npm run lint`.

## Manual test checklist

1. **Empty state:** the first visit shows "No expenses yet". Click **Load sample data** to get
   ~3 months of demo expenses.
2. **Dashboard:** check the four summary cards, the category donut (hover a slice for its
   amount), the 6-month bar chart and the 5 most recent expenses.
3. **Add:** click **Add expense** in the header and submit the empty form to see the errors.
   Try `12.345`, `-5` and a future date. Then add a valid expense and watch for the "Expense
   added" toast.
4. **Edit:** click **Edit** on any row, change the amount and save.
5. **Delete:** click **Delete**, then **Undo** in the toast to bring it back.
6. **Filter:** on the **Expenses** page, search by text, choose a category and set a From/To
   range. The count and total update as you go. Click **Clear filters** to reset.
7. **Export:** click **Export CSV**. It downloads only the rows currently shown.
8. **Persistence:** reload the page and your data is still there. Open a second tab; changes in
   one tab appear in the other.
9. **Mobile:** narrow the window or use device mode in dev tools. The layout switches to cards
   with no horizontal scrolling.

To reset all data, run `localStorage.clear()` in the browser console.
