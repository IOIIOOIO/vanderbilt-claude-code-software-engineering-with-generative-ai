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
| Export Center (CSV / JSON / PDF, see below) | `src/lib/export/`, `src/components/export/` |
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
- **Responsive:** a table on desktop, stacked cards on mobile. The add/edit modal opens as a
  bottom sheet on phones.

## Data export, version 2 (branch `feature-data-export-v2`)

An "Export Center" in a slide-over drawer, opened from **Export data…** on the dashboard or
**Export…** on the Expenses page. The Expenses page passes its current category and date filters
into the drawer.

- **Formats:** CSV (with a byte-order mark so Excel reads UTF-8, and formula-injection
  protection), JSON (the records plus metadata about the export and its filters), and PDF (a
  branded report with a category summary, a totals row and page numbers).
- **Filters:** quick date presets (all time, this month, last month, last 90 days, year to date)
  or custom start and end dates, plus category checkboxes with a live count for each.
- **Live summary and preview:** the record count, total, date span, a category breakdown bar and
  the first 8 rows, all updating as you change options.
- **File name:** the extension follows the chosen format, and unsafe characters are cleaned out
  with a "Will be saved as …" hint.
- **States:** validation errors, a spinner while exporting, a success message showing the file
  name and size, and the drawer can't be closed mid-export.

**How it's built:** the logic lives in `src/lib/export/` and doesn't use React.
- `selection.ts`: filtering, the summary, validation, file-name cleaning and the date presets.
- `formats.ts`: the CSV, JSON and PDF builders, registered by format so a new format can be added
  in one place.
- `run.ts`: picks the records, builds the file and starts the download.

The PDF library (jsPDF) only loads when someone exports a PDF, so the app's normal page load
isn't slowed by it.

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
