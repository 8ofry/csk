export type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUAL: 12,
};

export const BILLING_BUNDLE_DISCOUNT: Record<BillingCycle, number> = {
  MONTHLY: 0,
  QUARTERLY: 10,
  ANNUAL: 20,
};

export interface BundleQuote {
  billingCycle: BillingCycle;
  months: number;
  baseTotal: number;
  discountPercent: number;
  discountAmount: number;
  trialCreditApplied: number;
  finalAmount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBundleQuote(opts: {
  monthlyFee: number;
  billingCycle: BillingCycle;
  trialCreditEgp?: number;
}): BundleQuote {
  const months = BILLING_CYCLE_MONTHS[opts.billingCycle];
  const discountPercent = BILLING_BUNDLE_DISCOUNT[opts.billingCycle];
  const baseTotal = round2(Math.max(0, opts.monthlyFee) * months);
  const discountAmount = round2((baseTotal * discountPercent) / 100);
  const afterDiscount = round2(baseTotal - discountAmount);
  const trialCreditApplied = round2(
    Math.min(afterDiscount, Math.max(0, opts.trialCreditEgp ?? 0)),
  );
  const finalAmount = round2(Math.max(0, afterDiscount - trialCreditApplied));

  return {
    billingCycle: opts.billingCycle,
    months,
    baseTotal,
    discountPercent,
    discountAmount,
    trialCreditApplied,
    finalAmount,
  };
}

export function formatReferralCode(userId: string): string {
  const clean = userId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `CSK-${clean.slice(-6).padStart(6, "0")}`;
}
