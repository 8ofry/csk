import { describe, expect, it } from "vitest";
import { resolveSplitRules } from "@/domain/financial/rule-resolver";
import { computeSplit } from "@/domain/financial/split-engine";

describe("split rule resolver — SRS §10.3 precedence", () => {
  const partnerSubscription = {
    revenueType: "SUBSCRIPTION" as const,
    venuePercent: 60,
    cskPercent: 25,
    coachPercent: 15,
    otherPercent: 0,
    otherLabel: null,
  };

  it("uses location defaults when no contract", () => {
    const rules = resolveSplitRules({
      revenueType: "SUBSCRIPTION",
      locationRule: partnerSubscription,
    });
    expect(rules).toContainEqual({
      recipientType: "VENUE",
      percent: 60,
      recipientLocationId: undefined,
    });
    expect(rules).toContainEqual({ recipientType: "CSK", percent: 25 });
    expect(rules).toContainEqual({
      recipientType: "COACH",
      percent: 15,
      recipientUserId: undefined,
    });
  });

  it("contract override rebalances CSK, keeps venue constant", () => {
    const rules = resolveSplitRules({
      revenueType: "SUBSCRIPTION",
      locationRule: partnerSubscription,
      coachContract: { subscriptionPercent: 20 },
    });
    expect(rules.find((r) => r.recipientType === "VENUE")?.percent).toBe(60);
    expect(rules.find((r) => r.recipientType === "COACH")?.percent).toBe(20);
    expect(rules.find((r) => r.recipientType === "CSK")?.percent).toBe(20);
  });

  it("contract override that maps to a different stream is ignored", () => {
    // Setting beltExamPercent should NOT affect SUBSCRIPTION resolution.
    const rules = resolveSplitRules({
      revenueType: "SUBSCRIPTION",
      locationRule: partnerSubscription,
      coachContract: { beltExamPercent: 50 },
    });
    expect(rules.find((r) => r.recipientType === "COACH")?.percent).toBe(15); // base, not 50
  });

  it("Fight Club CSK-owned: no venue line", () => {
    const fightClub = {
      revenueType: "SUBSCRIPTION" as const,
      venuePercent: 0,
      cskPercent: 85,
      coachPercent: 15,
      otherPercent: 0,
      otherLabel: null,
    };
    const rules = resolveSplitRules({
      revenueType: "SUBSCRIPTION",
      locationRule: fightClub,
    });
    expect(rules.find((r) => r.recipientType === "VENUE")).toBeUndefined();
  });

  it("belt exam — federation 6%, coach 4%, CSK 90%", () => {
    const beltRule = {
      revenueType: "BELT_EXAM" as const,
      venuePercent: 0,
      cskPercent: 90,
      coachPercent: 4,
      otherPercent: 6,
      otherLabel: "federation",
    };
    const rules = resolveSplitRules({
      revenueType: "BELT_EXAM",
      locationRule: beltRule,
    });
    expect(rules.find((r) => r.recipientType === "FEDERATION")?.percent).toBe(6);
    expect(rules.find((r) => r.recipientType === "CSK")?.percent).toBe(90);
    expect(rules.find((r) => r.recipientType === "COACH")?.percent).toBe(4);

    // Engine consumes them and computes correct EGP amounts (Example 4 from SRS §10.2)
    const r = computeSplit({ grossAmount: 800, rules });
    expect(r.splits.find((s) => s.recipientType === "FEDERATION")?.amount).toBe(48);
    expect(r.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(32);
    expect(r.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(720);
  });

  it("end-to-end: contract override 20% → 1000 EGP gross splits 600/200/200", () => {
    const rules = resolveSplitRules({
      revenueType: "SUBSCRIPTION",
      locationRule: partnerSubscription,
      coachContract: { subscriptionPercent: 20 },
    });
    const result = computeSplit({ grossAmount: 1000, rules });
    expect(result.splits.find((s) => s.recipientType === "VENUE")?.amount).toBe(600);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(200);
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(200);
    expect(result.splitTotal).toBe(1000);
  });
});
