// SRS §10.1 default revenue-stream split rules.
// These are seeded into LocationSplitRule rows; Admin UI can edit per location/discipline at any time
// (no code change required, per §10 "Confirmation needed" callout).

import type { SplitRule, RevenueType } from "./types";

interface DefaultRuleSet {
  partnerVenue: SplitRule[];
  fightClub: SplitRule[];
}

export const defaultSplitRules: Record<RevenueType, DefaultRuleSet> = {
  // Group subscription
  SUBSCRIPTION: {
    partnerVenue: [
      { recipientType: "VENUE", percent: 60 },
      { recipientType: "CSK", percent: 25 },
      { recipientType: "COACH", percent: 15 },
    ],
    fightClub: [
      { recipientType: "CSK", percent: 85 },
      { recipientType: "COACH", percent: 15 },
    ],
  },

  // Private session
  PRIVATE_SESSION: {
    partnerVenue: [
      { recipientType: "VENUE", percent: 50 },
      { recipientType: "CSK", percent: 20 },
      { recipientType: "COACH", percent: 30 },
    ],
    fightClub: [
      { recipientType: "CSK", percent: 70 },
      { recipientType: "COACH", percent: 30 },
    ],
  },

  // Belt exam — venue takes nothing; same rule everywhere
  BELT_EXAM: {
    partnerVenue: [
      { recipientType: "CSK", percent: 90 },
      { recipientType: "COACH", percent: 4 },
      { recipientType: "FEDERATION", percent: 6, label: "federation" },
    ],
    fightClub: [
      { recipientType: "CSK", percent: 90 },
      { recipientType: "COACH", percent: 4 },
      { recipientType: "FEDERATION", percent: 6, label: "federation" },
    ],
  },

  // Championship registration — same rule everywhere
  CHAMPIONSHIP: {
    partnerVenue: [
      { recipientType: "CSK", percent: 90 },
      { recipientType: "COACH", percent: 4 },
      { recipientType: "TAX_ADMIN", percent: 6, label: "tax/admin" },
    ],
    fightClub: [
      { recipientType: "CSK", percent: 90 },
      { recipientType: "COACH", percent: 4 },
      { recipientType: "TAX_ADMIN", percent: 6, label: "tax/admin" },
    ],
  },

  // Merchandise — 100% to CSK regardless of sale location (FR-MRC-03)
  MERCHANDISE: {
    partnerVenue: [{ recipientType: "CSK", percent: 100 }],
    fightClub: [{ recipientType: "CSK", percent: 100 }],
  },
};
