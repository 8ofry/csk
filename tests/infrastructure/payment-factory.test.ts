import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  paymentAdapter,
  paymentAdapterFor,
  resetPaymentAdapter,
} from "@/infrastructure/payments/factory";

const ALL_PROVIDER_ENV = [
  "PAYMOB_API_KEY",
  "PAYMOB_INTEGRATION_ID",
  "PAYMOB_IFRAME_ID",
  "PAYMOB_HMAC_SECRET",
  "VODAFONE_CASH_MERCHANT_ID",
  "VODAFONE_CASH_TERMINAL_ID",
  "VODAFONE_CASH_SECRET",
  "FAWRY_MERCHANT_CODE",
  "FAWRY_SECURITY_KEY",
];

function clearProviderEnv() {
  for (const k of ALL_PROVIDER_ENV) delete process.env[k];
}

describe("payment adapter selection", () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    resetPaymentAdapter();
    clearProviderEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL };
    resetPaymentAdapter();
  });

  it("auto picks Paymob when fully configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    process.env.PAYMOB_API_KEY = "k";
    process.env.PAYMOB_INTEGRATION_ID = "1";
    process.env.PAYMOB_IFRAME_ID = "2";
    process.env.PAYMOB_HMAC_SECRET = "s";
    expect(paymentAdapter().provider).toBe("paymob");
  });

  it("auto picks Vodafone Cash when only it is configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    process.env.VODAFONE_CASH_MERCHANT_ID = "M";
    process.env.VODAFONE_CASH_TERMINAL_ID = "T";
    process.env.VODAFONE_CASH_SECRET = "s";
    expect(paymentAdapter().provider).toBe("vodafone-cash");
  });

  it("auto picks Fawry when only it is configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    process.env.FAWRY_MERCHANT_CODE = "MC";
    process.env.FAWRY_SECURITY_KEY = "sk";
    expect(paymentAdapter().provider).toBe("fawry");
  });

  it("auto prefers Paymob over Vodafone Cash when both configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    process.env.PAYMOB_API_KEY = "k";
    process.env.PAYMOB_INTEGRATION_ID = "1";
    process.env.PAYMOB_IFRAME_ID = "2";
    process.env.PAYMOB_HMAC_SECRET = "s";
    process.env.VODAFONE_CASH_MERCHANT_ID = "M";
    process.env.VODAFONE_CASH_TERMINAL_ID = "T";
    process.env.VODAFONE_CASH_SECRET = "s";
    expect(paymentAdapter().provider).toBe("paymob");
  });

  it("auto falls back to console in dev when nothing configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    vi.stubEnv("NODE_ENV", "development");
    expect(paymentAdapter().provider).toBe("console");
    vi.unstubAllEnvs();
  });

  it("auto throws in production when nothing is configured", () => {
    process.env.PAYMENT_PROVIDER = "auto";
    vi.stubEnv("NODE_ENV", "production");
    expect(() => paymentAdapter()).toThrow(/no payment adapter/i);
    vi.unstubAllEnvs();
  });

  it("explicit PAYMENT_PROVIDER=console always picks console", () => {
    process.env.PAYMENT_PROVIDER = "console";
    expect(paymentAdapter().provider).toBe("console");
  });

  it("explicit unknown provider throws", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    expect(() => paymentAdapter()).toThrow(/unknown PAYMENT_PROVIDER/i);
  });

  it("caches the adapter instance", () => {
    process.env.PAYMENT_PROVIDER = "console";
    const a = paymentAdapter();
    const b = paymentAdapter();
    expect(a).toBe(b);
  });

  it("paymentAdapterFor looks up by name and is uncached", () => {
    expect(paymentAdapterFor("paymob").provider).toBe("paymob");
    expect(paymentAdapterFor("vodafone-cash").provider).toBe("vodafone-cash");
    expect(paymentAdapterFor("fawry").provider).toBe("fawry");
    expect(() => paymentAdapterFor("unknown")).toThrow(/unknown payment provider/i);
  });
});
