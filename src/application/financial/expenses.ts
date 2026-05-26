import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const logExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().min(0.01),
  method: z.nativeEnum(PaymentMethod),
  description: z.string().optional().nullable(),
  paidAt: z.coerce.date().optional(),
  recipientUserId: z.string().optional().nullable(),
  recurringExpenseId: z.string().optional().nullable(),
});

export type LogExpenseInput = z.infer<typeof logExpenseSchema>;

export async function logExpense(input: LogExpenseInput, loggedByUserId: string) {
  return prisma.expense.create({
    data: {
      category: input.category,
      amount: input.amount,
      method: input.method,
      description: input.description || null,
      paidAt: input.paidAt ?? new Date(),
      loggedById: loggedByUserId,
      recipientUserId: input.recipientUserId || null,
      recurringExpenseId: input.recurringExpenseId || null,
    },
  });
}

export async function listExpenses(filters: {
  from?: Date;
  to?: Date;
  category?: ExpenseCategory;
  recipientUserId?: string;
}) {
  const where: Prisma.ExpenseWhereInput = {};
  if (filters.from || filters.to) {
    where.paidAt = {};
    if (filters.from) where.paidAt.gte = filters.from;
    if (filters.to) where.paidAt.lte = filters.to;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.recipientUserId) {
    where.recipientUserId = filters.recipientUserId;
  }

  return prisma.expense.findMany({
    where,
    orderBy: { paidAt: "desc" },
    include: {
      loggedBy: {
        select: {
          fullNameEn: true,
          fullNameAr: true,
        },
      },
      recipientUser: {
        select: {
          id: true,
          fullNameEn: true,
          fullNameAr: true,
        },
      },
    },
  });
}

export async function deleteExpense(id: string) {
  return prisma.expense.delete({
    where: { id },
  });
}

export const createRecurringExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().min(0.01),
  method: z.nativeEnum(PaymentMethod),
  description: z.string().optional().nullable(),
  dayOfMonth: z.coerce.number().int().min(1).max(31).default(1),
});

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;

export async function createRecurringExpense(input: CreateRecurringExpenseInput) {
  return prisma.recurringExpense.create({
    data: {
      category: input.category,
      amount: input.amount,
      method: input.method,
      description: input.description || null,
      dayOfMonth: input.dayOfMonth,
    },
  });
}

export async function listRecurringExpenses() {
  return prisma.recurringExpense.findMany({
    where: { active: true },
    orderBy: { dayOfMonth: "asc" },
  });
}

export async function deleteRecurringExpense(id: string) {
  return prisma.recurringExpense.delete({
    where: { id },
  });
}

export async function getRecurringDuesForMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const recurring = await prisma.recurringExpense.findMany({
    where: { active: true },
  });

  const loggedExpenses = await prisma.expense.findMany({
    where: {
      paidAt: {
        gte: start,
        lte: end,
      },
    },
  });

  return recurring.map((rec) => {
    const matchedExpense = loggedExpenses.find(
      (exp) =>
        exp.recurringExpenseId === rec.id ||
        (exp.recurringExpenseId === null && exp.category === rec.category)
    );

    return {
      id: rec.id,
      category: rec.category,
      amount: Number(rec.amount),
      currency: rec.currency,
      method: rec.method,
      description: rec.description,
      dayOfMonth: rec.dayOfMonth,
      active: rec.active,
      isPaid: !!matchedExpense,
      paidExpense: matchedExpense
        ? {
            id: matchedExpense.id,
            amount: Number(matchedExpense.amount),
            paidAt: matchedExpense.paidAt,
          }
        : null,
    };
  });
}

