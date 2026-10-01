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
