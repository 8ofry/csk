import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  computePaymobHmac,
  PaymobAdapter,
  type PaymobWebhookObj,
} from "@/infrastructure/payments/paymob";

const SECRET = "test-paymob-hmac-secret";

const validObj: PaymobWebhookObj = {
  amount_cents: 100_000,
  created_at: "2026-05-11T18:00:00.000000",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 9_999_001,
  integration_id: 12345,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: false,
  is_voided: false,
  order: { id: 8_888_001, merchant_order_id: "intent-abc" },
  owner: 7_777_001,
  pending: false,
  source_data: { pan: "9333", sub_type: "MasterCard", type: "card" },
  success: true,
};

describe("Paymob HMAC", () => {
  it("computes a deterministic SHA-512 hex digest", () => {
    const hmac = computePaymobHmac(validObj, SECRET);
    expect(hmac).toMatch(/^[a-f0-9]{128}$/);
    // Same inputs → same output
    expect(computePaymobHmac(validObj, SECRET)).toBe(hmac);
  });

  it("changes when any field changes", () => {
    const a = computePaymobHmac(validObj, SECRET);
    const b = computePaymobHmac({ ...validObj, success: false }, SECRET);
    expect(a).not.toBe(b);
  });

  it("changes when the secret changes", () => {
    const a = computePaymobHmac(validObj, SECRET);
    const b = computePaymobHmac(validObj, "different-secret");
    expect(a).not.toBe(b);
  });

  it("matches an independently-computed HMAC against the documented field order", () => {
    const fields = [
      "100000", "2026-05-11T18:00:00.000000", "EGP", "false", "false",
      "9999001", "12345", "true", "false", "false",
      "false", "false", "false",
      "8888001", "7777001", "false",
      "9333", "MasterCard", "card", "true",
    ].join("");
    const expected = crypto.createHmac("sha512", SECRET).update(fields).digest("hex");
    expect(computePaymobHmac(validObj, SECRET)).toBe(expected);
  });
});

describe("PaymobAdapter — verifyWebhook", () => {
  function makeAdapter() {
    return new PaymobAdapter({
      PAYMOB_API_KEY: "k",
      PAYMOB_INTEGRATION_ID: "12345",
      PAYMOB_IFRAME_ID: "67890",
      PAYMOB_HMAC_SECRET: SECRET,
    } as unknown as NodeJS.ProcessEnv);
  }

  it("isConfigured when all four env vars are set", () => {
    expect(makeAdapter().isConfigured).toBe(true);
  });

  it("not configured when missing keys", () => {
    expect(
      new PaymobAdapter({ PAYMOB_API_KEY: "k" } as unknown as NodeJS.ProcessEnv).isConfigured,
    ).toBe(false);
  });

  it("rejects webhook with mismatched HMAC", () => {
    const adapter = makeAdapter();
    const event = adapter.verifyWebhook({
      headers: {},
      body: { obj: validObj, hmac: "00".repeat(64) },
    });
    expect(event).toBeNull();
  });

  it("accepts webhook with valid HMAC and projects to normalized event", () => {
    const adapter = makeAdapter();
    const hmac = computePaymobHmac(validObj, SECRET);
    const event = adapter.verifyWebhook({
      headers: {},
      body: { obj: validObj, hmac },
    });
    expect(event).not.toBeNull();
    expect(event!.intentId).toBe("intent-abc");
    expect(event!.outcome).toBe("SUCCESS");
    expect(event!.amount).toBe(1000); // 100,000 cents → 1000 EGP
    expect(event!.currency).toBe("EGP");
    expect(event!.providerTransactionId).toBe("9999001");
  });

  it("classifies failure when success=false even with valid HMAC", () => {
    const adapter = makeAdapter();
    const failed: PaymobWebhookObj = { ...validObj, success: false };
    const hmac = computePaymobHmac(failed, SECRET);
    const event = adapter.verifyWebhook({ headers: {}, body: { obj: failed, hmac } });
    expect(event!.outcome).toBe("FAILED");
  });

  it("rejects body without obj/hmac fields", () => {
    const adapter = makeAdapter();
    expect(adapter.verifyWebhook({ headers: {}, body: null })).toBeNull();
    expect(adapter.verifyWebhook({ headers: {}, body: { obj: validObj } })).toBeNull();
    expect(adapter.verifyWebhook({ headers: {}, body: { hmac: "x" } })).toBeNull();
  });
});
