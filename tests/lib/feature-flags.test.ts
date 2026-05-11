import { afterEach, describe, expect, it } from "vitest";
import { featureFlags } from "@/lib/feature-flags";

describe("feature flags", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("recognizes truthy strings", () => {
    for (const v of ["1", "true", "TRUE", "on", "yes"]) {
      process.env.FEATURE_ONLINE_PAYMENTS = v;
      expect(featureFlags.onlinePayments()).toBe(true);
    }
  });

  it("treats empty/missing/falsy as off", () => {
    delete process.env.FEATURE_ONLINE_PAYMENTS;
    expect(featureFlags.onlinePayments()).toBe(false);
    process.env.FEATURE_ONLINE_PAYMENTS = "";
    expect(featureFlags.onlinePayments()).toBe(false);
    process.env.FEATURE_ONLINE_PAYMENTS = "false";
    expect(featureFlags.onlinePayments()).toBe(false);
    process.env.FEATURE_ONLINE_PAYMENTS = "0";
    expect(featureFlags.onlinePayments()).toBe(false);
  });

  it("each flag is independent", () => {
    process.env.FEATURE_ONLINE_PAYMENTS = "true";
    process.env.FEATURE_ECOMMERCE_CHECKOUT = "false";
    expect(featureFlags.onlinePayments()).toBe(true);
    expect(featureFlags.ecommerceCheckout()).toBe(false);
  });
});
