// Split-rule resolution — pure logic.
// Given a location's stored split rule + an optional coach contract override,
// produces the SplitRule[] that the engine will compute against.
//
// Precedence (SRS §10.3):
//   coach contract override (per-stream %)  >  location split rule  >  default
// If contract supplies a coach %, the COACH portion uses that and the remainder
// is rebalanced into CSK's share. Venue stays as configured.

import type { RevenueType, SplitRule } from "./types";

export interface PersistedSplitRule {
  revenueType: RevenueType;
  venuePercent: number;
  cskPercent: number;
  coachPercent: number;
  otherPercent: number;
  otherLabel?: string | null;
}

export interface CoachContractOverrides {
  /** All optional. Only the matching stream's % is used. */
  subscriptionPercent?: number | null;
  privateSessionPercent?: number | null;
  privateSessionFixedRate?: number | null;
  beltExamPercent?: number | null;
  championshipPercent?: number | null;
}

export interface ResolveInput {
  revenueType: RevenueType;
  /** The base rule rows seeded for the location. */
  locationRule: PersistedSplitRule;
  coachContract?: CoachContractOverrides | null;
  /** Optional recipient identifiers (used so the persisted RevenueSplit row is recipient-aware). */
  recipientCoachUserId?: string;
  recipientLocationId?: string;
}

function pickContractPercent(
  rt: RevenueType,
  c?: CoachContractOverrides | null,
): number | null {
  if (!c) return null;
  switch (rt) {
    case "SUBSCRIPTION":
      return c.subscriptionPercent ?? null;
    case "PRIVATE_SESSION":
      return c.privateSessionPercent ?? null;
    case "BELT_EXAM":
      return c.beltExamPercent ?? null;
    case "CHAMPIONSHIP":
      return c.championshipPercent ?? null;
    case "MERCHANDISE":
      return null;
  }
}

export function resolveSplitRules(input: ResolveInput): SplitRule[] {
  const { revenueType, locationRule, coachContract } = input;

  const venue = Number(locationRule.venuePercent);
  const baseCsk = Number(locationRule.cskPercent);
  const baseCoach = Number(locationRule.coachPercent);
  const other = Number(locationRule.otherPercent);
  const otherLabel = locationRule.otherLabel ?? undefined;

  const contractCoach = pickContractPercent(revenueType, coachContract);
  const coachPct = contractCoach != null ? contractCoach : baseCoach;
  // Rebalance: hold venue + other constant; CSK absorbs the delta from the contract.
  const cskPct = +(100 - venue - coachPct - other).toFixed(2);

  const rules: SplitRule[] = [];
  if (venue > 0) {
    rules.push({
      recipientType: "VENUE",
      percent: venue,
      recipientLocationId: input.recipientLocationId,
    });
  }
  if (cskPct > 0) {
    rules.push({ recipientType: "CSK", percent: cskPct });
  }
  if (coachPct > 0) {
    rules.push({
      recipientType: "COACH",
      percent: coachPct,
      recipientUserId: input.recipientCoachUserId,
    });
  }
  if (other > 0) {
    // Map persisted "other" to a typed bucket where we can — federation/tax_admin/etc.
    const recipientType =
      otherLabel?.toLowerCase().includes("federation")
        ? "FEDERATION"
        : otherLabel?.toLowerCase().includes("tax")
          ? "TAX_ADMIN"
          : "DISCIPLINE_OWNER";
    rules.push({
      recipientType,
      percent: other,
      label: otherLabel,
    });
  }

  return rules;
}
