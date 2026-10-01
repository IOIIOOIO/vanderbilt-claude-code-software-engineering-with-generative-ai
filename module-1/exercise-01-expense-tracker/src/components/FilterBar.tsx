"use client";

import { CATEGORIES, EMPTY_FILTERS, type Category, type ExpenseFilters } from "@/lib/types";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: ExpenseFilters;
  onChange: (f: ExpenseFilters) => void;
}) {
  const active =
    filters.search || filters.category !== "All" || filters.from || filters.to;
  const rangeInvalid = filters.from && filters.to && filters.from > filters.to;

  return (
    <div className="card space-y-3 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="label">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Description or category"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="filter-category" className="label">Category</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as Category | "All" })}
            className="input"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label">From</label>
          <input
            id="from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="to" className="label">To</label>
          <input
            id="to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
            className="input"
          />
        </div>
      </div>
      {(active || rangeInvalid) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-600">{rangeInvalid ? "“From” is after “To”, so nothing matches." : ""}</span>
          <button onClick={() => onChange(EMPTY_FILTERS)} className="font-medium text-brand-600 hover:text-brand-700">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
