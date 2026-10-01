import { CATEGORIES, type Category, type ExpenseInput } from "./types";
import { todayISO } from "./format";

export interface ExpenseFormValues {
  date: string;
  amount: string;
  category: string;
  description: string;
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export const MAX_AMOUNT = 1_000_000;
export const MAX_DESCRIPTION = 120;

export function validateExpense(
  values: ExpenseFormValues,
  today: string = todayISO(),
): { errors: ExpenseFormErrors; data?: ExpenseInput } {
  const errors: ExpenseFormErrors = {};

  if (!values.date) {
    errors.date = "Date is required.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || isNaN(Date.parse(values.date))) {
    errors.date = "Enter a valid date.";
  } else if (values.date > today) {
    errors.date = "Date can't be in the future.";
  }

  const amountText = values.amount.trim();
  const amount = Number(amountText);
  if (!amountText) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount)) {
    errors.amount = "Enter a number with up to 2 decimal places.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else if (amount > MAX_AMOUNT) {
    errors.amount = `Amount can't exceed ${MAX_AMOUNT.toLocaleString()}.`;
  }

  if (!CATEGORIES.includes(values.category as Category)) {
    errors.category = "Choose a category.";
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length > MAX_DESCRIPTION) {
    errors.description = `Keep it under ${MAX_DESCRIPTION} characters.`;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    data: {
      date: values.date,
      amount: Math.round(amount * 100) / 100,
      category: values.category as Category,
      description,
    },
  };
}
