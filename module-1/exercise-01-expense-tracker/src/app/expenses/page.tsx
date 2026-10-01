"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { useEditor } from "@/components/AppShell";
import { FilterBar } from "@/components/FilterBar";
import { ExpenseList } from "@/components/ExpenseList";
import { EmptyState, Skeleton } from "@/components/States";
import { filterExpenses, sortExpenses, sum } from "@/lib/analytics";
import { downloadCSV } from "@/lib/csv";
import { formatCurrency, todayISO } from "@/lib/format";
import { EMPTY_FILTERS, type ExpenseFilters } from "@/lib/types";

export default function ExpensesPage() {
  const { expenses, loading } = useExpenses();
  const { openAdd, openEdit, remove } = useEditor();
  const toast = useToast();
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS);

  const visible = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters)),
    [expenses, filters],
  );

  const exportCSV = () => {
    try {
      downloadCSV(visible, `expenses-${todayISO()}.csv`);
      toast(`Exported ${visible.length} expense${visible.length === 1 ? "" : "s"} to CSV.`);
    } catch {
      toast("Export failed. Please try again.", "error");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500">Search, filter, edit and export your expenses.</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV} disabled={loading || visible.length === 0}>
          ⬇ Export CSV
        </button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <section className="card p-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState title="No expenses yet" message="Expenses you add will show up here.">
            <button className="btn-primary" onClick={openAdd}>Add expense</button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState title="No matches" message="No expenses match these filters.">
            <button className="btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
          </EmptyState>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between text-sm text-slate-500">
              <span>
                {visible.length} of {expenses.length} expense{expenses.length === 1 ? "" : "s"}
              </span>
              <span>
                Total: <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(sum(visible))}</span>
              </span>
            </div>
            <ExpenseList expenses={visible} onEdit={openEdit} onDelete={remove} />
          </>
        )}
      </section>
    </>
  );
}
