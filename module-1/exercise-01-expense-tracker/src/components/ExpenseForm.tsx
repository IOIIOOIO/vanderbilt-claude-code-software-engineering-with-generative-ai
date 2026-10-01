"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_STYLES, type Expense, type ExpenseInput } from "@/lib/types";
import { todayISO } from "@/lib/format";
import {
  MAX_DESCRIPTION,
  validateExpense,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from "@/lib/validation";

export function ExpenseForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Expense;
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ExpenseFormValues>({
    date: initial?.date ?? todayISO(),
    amount: initial ? initial.amount.toFixed(2) : "",
    category: initial?.category ?? "",
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof ExpenseFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    // Re-validate live once the user has tried to submit.
    if (submitted) setErrors(validateExpense(next).errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const result = validateExpense(values);
    setErrors(result.errors);
    if (result.data) onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Amount" error={errors.amount} htmlFor="amount">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">$</span>
            <input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={values.amount}
              onChange={set("amount")}
              aria-invalid={!!errors.amount}
              className={`input pl-7 ${errors.amount ? "input-error" : ""}`}
            />
          </div>
        </Field>
        <Field label="Date" error={errors.date} htmlFor="date">
          <input
            id="date"
            type="date"
            max={todayISO()}
            value={values.date}
            onChange={set("date")}
            aria-invalid={!!errors.date}
            className={`input ${errors.date ? "input-error" : ""}`}
          />
        </Field>
      </div>

      <Field label="Category" error={errors.category} htmlFor="category">
        <select
          id="category"
          value={values.category}
          onChange={set("category")}
          aria-invalid={!!errors.category}
          className={`input ${errors.category ? "input-error" : ""}`}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_STYLES[c].icon} {c}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Description"
        error={errors.description}
        htmlFor="description"
        hint={`${values.description.trim().length}/${MAX_DESCRIPTION}`}
      >
        <input
          id="description"
          placeholder="e.g. Weekly groceries"
          value={values.description}
          onChange={set("description")}
          aria-invalid={!!errors.description}
          className={`input ${errors.description ? "input-error" : ""}`}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initial ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
