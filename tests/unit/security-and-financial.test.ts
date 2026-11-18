import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateVerificationToken,
  verifyVerificationToken,
} from "@/lib/verification-token";
import { defaultSplitRules } from "@/domain/financial/default-rules";
import { computeSplit } from "@/domain/financial/split-engine";
import { computeBundleQuote, formatReferralCode } from "@/domain/financial/bundles";
import { isAtLeast } from "@/lib/rbac";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

import { revalidateLocalized } from "@/lib/revalidate";

describe("Verification token security", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "unit-test-secret-key-for-hmac-signing";
  });

  it("signs and verifies a valid token", () => {
    const token = generateVerificationToken("user-123");
    expect(verifyVerificationToken(token)).toBe("user-123");
  });

  it("rejects a tampered token", () => {
    const token = generateVerificationToken("user-123");
    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifyVerificationToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = 1_000_000;
    const token = generateVerificationToken("user-123", now);
    expect(verifyVerificationToken(token, now + 25 * 60 * 60 * 1000)).toBeNull();
  });
});

describe("DROP_IN split rules", () => {
  it("computes partnerVenue and fightClub DROP_IN splits summing to 100%", () => {
    const pv = computeSplit({
      grossAmount: 250,
      rules: defaultSplitRules.DROP_IN.partnerVenue,
    });
    expect(pv.splitTotal).toBe(250);
    expect(pv.splits.find((s) => s.recipientType === "VENUE")?.amount).toBe(125);
    expect(pv.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(75);
    expect(pv.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(50);

    const fc = computeSplit({
      grossAmount: 250,
      rules: defaultSplitRules.DROP_IN.fightClub,
    });
    expect(fc.splitTotal).toBe(250);
    expect(fc.splits.find((s) => s.recipientType === "CSK")?.amount).toBe(200);
    expect(fc.splits.find((s) => s.recipientType === "COACH")?.amount).toBe(50);
  });
});

describe("RBAC hierarchy", () => {
  it("enforces ADMIN > HEAD_COACH > COACH > INTERN > TRAINEE", () => {
    expect(isAtLeast("HEAD_COACH", "ADMIN")).toBe(false);
    expect(isAtLeast("ADMIN", "HEAD_COACH")).toBe(true);
    expect(isAtLeast("COACH", "INTERN")).toBe(true);
    expect(isAtLeast("TRAINEE", "COACH")).toBe(false);
  });
});

describe("revalidateLocalized", () => {
  it("revalidates both /ar and /en paths", () => {
    mockRevalidatePath.mockClear();
    revalidateLocalized("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/ar/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/admin/users");
  });
});

describe("Subscription bundles & referral code", () => {
  it("computes quarterly and annual discounts with trial credit", () => {
    const q = computeBundleQuote({
      monthlyFee: 1000,
      billingCycle: "QUARTERLY",
      trialCreditEgp: 200,
    });
    expect(q.baseTotal).toBe(3000);
    expect(q.discountPercent).toBe(10);
    expect(q.discountAmount).toBe(300);
    expect(q.trialCreditApplied).toBe(200);
    expect(q.finalAmount).toBe(2500);
  });

  it("formats deterministic CSK referral codes", () => {
    expect(formatReferralCode("clx123abc99")).toBe("CSK-3ABC99");
  });
});
