import { describe, expect, it } from "vitest";
import { computeSplit, SplitInvariantError } from "@/domain/financial/split-engine";
import { defaultSplitRules } from "@/domain/financial/default-rules";

// Worked examples from SRS §10.2

describe("computeSplit — SRS §10.2 worked examples", () => {
  it("Example 1: Group subscription at Monster GYM (partner) — 1000 EGP", () => {
    const result = computeSplit({
      grossAmount: 1000,
      rules: defaultSplitRules.SUBSCRIPTION.partnerVenue,
    });
    expect(result.netAmount).toBe(1000);
    expect(result.splits.find((s) => s.recipientType === "VENUE")?.amount).toBe(600);
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(250);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(150);
    expect(result.splitTotal).toBe(1000);
  });

  it("Example 2: Group subscription at Fight Club — 1000 EGP, coach overrides to 20%", () => {
    const result = computeSplit({
      grossAmount: 1000,
      rules: [
        { recipientType: "CSK", percent: 80 },
        { recipientType: "COACH", percent: 20 },
      ],
    });
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(800);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(200);
    expect(result.splitTotal).toBe(1000);
  });

  it("Example 3: Private session at AddFit GYM — 500 EGP", () => {
    const result = computeSplit({
      grossAmount: 500,
      rules: defaultSplitRules.PRIVATE_SESSION.partnerVenue,
    });
    expect(result.splits.find((s) => s.recipientType === "VENUE")?.amount).toBe(250);
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(100);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(150);
    expect(result.splitTotal).toBe(500);
  });

  it("Example 4: Belt exam — 800 EGP", () => {
    const result = computeSplit({
      grossAmount: 800,
      rules: defaultSplitRules.BELT_EXAM.partnerVenue,
    });
    expect(result.splits.find((s) => s.recipientType === "FEDERATION")?.amount).toBe(48);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(32);
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(720);
    expect(result.splitTotal).toBe(800);
  });

  it("Example 5: Championship registration — 1500 EGP", () => {
    const result = computeSplit({
      grossAmount: 1500,
      rules: defaultSplitRules.CHAMPIONSHIP.partnerVenue,
    });
    expect(result.splits.find((s) => s.recipientType === "TAX_ADMIN")?.amount).toBe(90);
    expect(result.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(60);
    expect(result.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(1350);
    expect(result.splitTotal).toBe(1500);
  });

  it("Example 6: Merchandise — 600 EGP, 100% CSK", () => {
    const result = computeSplit({
      grossAmount: 600,
      rules: defaultSplitRules.MERCHANDISE.partnerVenue,
    });
    expect(result.splits).toHaveLength(1);
    expect(result.splits[0]?.amount).toBe(600);
  });
});

describe("computeSplit — invariants and edge cases (§10.3)", () => {
  it("rejects rules that do not sum to 100%", () => {
    expect(() =>
      computeSplit({
        grossAmount: 1000,
        rules: [
          { recipientType: "CSK", percent: 50 },
          { recipientType: "COACH", percent: 30 },
        ],
      }),
    ).toThrow(SplitInvariantError);
  });

  it("applies discount before split", () => {
    const result = computeSplit({
      grossAmount: 1000,
      discountPercent: 10,
      rules: defaultSplitRules.SUBSCRIPTION.partnerVenue,
    });
    expect(result.netAmount).toBe(900);
    expect(result.splitTotal).toBe(900);
    expect(result.splits.find((s) => s.recipientType === "VENUE")?.amount).toBe(540);
  });

  it("handles fractional rounding so splits sum to net exactly", () => {
    const result = computeSplit({
      grossAmount: 333.33,
      rules: [
        { recipientType: "CSK", percent: 33.33 },
        { recipientType: "COACH", percent: 33.33 },
        { recipientType: "VENUE", percent: 33.34 },
      ],
    });
    expect(result.splitTotal).toBe(result.netAmount);
  });

  it("rejects negative gross", () => {
    expect(() =>
      computeSplit({
        grossAmount: -1,
        rules: defaultSplitRules.MERCHANDISE.partnerVenue,
      }),
    ).toThrow(SplitInvariantError);
  });
});
