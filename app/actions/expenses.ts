"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import {
  logExpense,
  logExpenseSchema,
  deleteExpense,
  createRecurringExpense,
  createRecurringExpenseSchema,
  deleteRecurringExpense,
} from "@/application/financial/expenses";
import { requireRole } from "@/lib/auth-guard";

export async function logExpenseAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = logExpenseSchema.parse({
      category: formData.get("category"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description") || undefined,
      paidAt: formData.get("paidAt") || undefined,
      recipientUserId: formData.get("recipientUserId") || undefined,
      recurringExpenseId: formData.get("recurringExpenseId") || undefined,
    });
    await logExpense(data, user.id);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/expenses");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteExpenseAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    await requireRole("ADMIN");
    await deleteExpense(id);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/expenses");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createRecurringExpenseAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    await requireRole("ADMIN");
    const data = createRecurringExpenseSchema.parse({
      category: formData.get("category"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      description: formData.get("description") || undefined,
      dayOfMonth: formData.get("dayOfMonth") || undefined,
    });
    await createRecurringExpense(data);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/expenses");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteRecurringExpenseAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    await requireRole("ADMIN");
    await deleteRecurringExpense(id);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/expenses");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

