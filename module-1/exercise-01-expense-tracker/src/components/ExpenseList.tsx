"use client";

import { CATEGORY_STYLES, type Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function CategoryBadge({ category }: { category: Expense["category"] }) {
  const s = CATEGORY_STYLES[category];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}>
      <span aria-hidden>{s.icon}</span>
      {category}
    </span>
  );
}

export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => void;
}) {
  const actions = onEdit || onDelete;
  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{e.description}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <CategoryBadge category={e.category} />
                <span>{formatDate(e.date)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(e.amount)}</p>
              {actions && (
                <div className="mt-1 flex justify-end gap-3 text-xs">
                  {onEdit && <button onClick={() => onEdit(e)} className="text-brand-600">Edit</button>}
                  {onDelete && <button onClick={() => onDelete(e)} className="text-red-600">Delete</button>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            {actions && <th className="py-2 text-right font-medium"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <tr key={e.id} className="group hover:bg-slate-50">
              <td className="whitespace-nowrap py-3 pr-4 text-slate-500">{formatDate(e.date)}</td>
              <td className="max-w-xs truncate py-3 pr-4 font-medium text-slate-900">{e.description}</td>
              <td className="py-3 pr-4"><CategoryBadge category={e.category} /></td>
              <td className="py-3 pr-4 text-right font-semibold tabular-nums text-slate-900">
                {formatCurrency(e.amount)}
              </td>
              {actions && (
                <td className="whitespace-nowrap py-3 text-right">
                  {onEdit && (
                    <button onClick={() => onEdit(e)} className="rounded px-2 py-1 text-brand-600 hover:bg-brand-50">
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(e)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
