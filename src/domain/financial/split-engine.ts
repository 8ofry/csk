// SRS §10.3 — Computation Rules
// Invariant: split amounts sum to 100% of NET (post-discount) gross, ±1 piastre rounding tolerance.

import type { ComputedSplit, SplitInput, SplitResult } from "./types";

const ROUNDING_TOLERANCE_EGP = 0.01;
const PERCENT_TOLERANCE = 0.01;

export class SplitInvariantError extends Error {
  constructor(message: string) {
    super(`[SplitInvariant] ${message}`);
    this.name = "SplitInvariantError";
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeSplit(input: SplitInput): SplitResult {
  const { grossAmount, rules } = input;

  if (grossAmount < 0) {
    throw new SplitInvariantError("Gross amount must be non-negative");
  }

  const totalPercent = rules.reduce((sum, r) => sum + r.percent, 0);
  if (Math.abs(totalPercent - 100) > PERCENT_TOLERANCE) {
    throw new SplitInvariantError(
      `Split rules must sum to 100% (got ${totalPercent.toFixed(2)}%). Rules: ${rules
        .map((r) => `${r.recipientType}:${r.percent}%`)
        .join(", ")}`,
    );
  }

  const discountPct = input.discountPercent ?? 0;
  const discountFixed = input.discountFixed ?? 0;
  const afterPctDiscount = grossAmount * (1 - discountPct / 100);
  const netAmount = round2(Math.max(0, afterPctDiscount - discountFixed));
  const discountAmount = round2(grossAmount - netAmount);

  // Compute each split with full precision, round each, then fix any rounding drift on the largest split.
  const raw = rules.map((r) => ({
    rule: r,
    rawAmount: (netAmount * r.percent) / 100,
  }));
  const computed: ComputedSplit[] = raw.map(({ rule, rawAmount }) => ({
    recipientType: rule.recipientType,
    recipientUserId: rule.recipientUserId,
    recipientLocationId: rule.recipientLocationId,
    label: rule.label,
    percent: rule.percent,
    amount: round2(rawAmount),
  }));

  const splitTotal = round2(computed.reduce((s, c) => s + c.amount, 0));
  const drift = round2(netAmount - splitTotal);

  if (Math.abs(drift) > ROUNDING_TOLERANCE_EGP) {
    // Apply drift to the largest split so totals reconcile exactly
    const largestIdx = computed.reduce(
      (maxIdx, c, i, arr) => (c.amount > arr[maxIdx]!.amount ? i : maxIdx),
      0,
    );
    computed[largestIdx]!.amount = round2(computed[largestIdx]!.amount + drift);
  }

  const finalTotal = round2(computed.reduce((s, c) => s + c.amount, 0));
  if (Math.abs(finalTotal - netAmount) > ROUNDING_TOLERANCE_EGP) {
    throw new SplitInvariantError(
      `Reconciled splits ${finalTotal} do not match net amount ${netAmount}`,
    );
  }

  return {
    grossAmount: round2(grossAmount),
    discountAmount,
    netAmount,
    splits: computed,
    splitTotal: finalTotal,
  };
}
