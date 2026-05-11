// Subscription period + status logic — pure.
// FR-FIN-02: monthly renewal payable at the start of the month; status:
// paid / partial / due / overdue.

export type SubscriptionPaymentStatus = "PAID" | "PARTIAL" | "DUE" | "OVERDUE";

export function deriveStatus(input: {
  monthlyFee: number;
  amountPaidInPeriod: number;
  periodEnd: Date;
  now?: Date;
  /** Days after periodEnd to flag as overdue. Default 0 — overdue once period ends unpaid. */
  graceDays?: number;
}): SubscriptionPaymentStatus {
  const { monthlyFee, amountPaidInPeriod, periodEnd } = input;
  const now = input.now ?? new Date();
  const grace = input.graceDays ?? 0;

  if (amountPaidInPeriod >= monthlyFee) return "PAID";
  if (amountPaidInPeriod > 0 && amountPaidInPeriod < monthlyFee) return "PARTIAL";

  const overdueAfter = new Date(periodEnd);
  overdueAfter.setDate(overdueAfter.getDate() + grace);
  if (now > overdueAfter) return "OVERDUE";
  return "DUE";
}

export function periodForMonth(year: number, month: number): { start: Date; end: Date } {
  // 0-indexed month in JS Date
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of the month
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function nextPeriodAfter(currentEnd: Date): { start: Date; end: Date } {
  const next = new Date(currentEnd);
  next.setDate(currentEnd.getDate() + 1);
  return periodForMonth(next.getFullYear(), next.getMonth() + 1);
}
