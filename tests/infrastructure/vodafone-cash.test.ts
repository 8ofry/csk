import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  computeVodafoneCallbackSignature,
  computeVodafoneSignature,
  VodafoneCashAdapter,
} from "@/infrastructure/payments/vodafone-cash";

const SECRET = "vodafone-test-secret";

describe("Vodafone Cash signature helpers", () => {
  it("initiate signature is HMAC-SHA256 hex over the documented field order", () => {
    const sig = computeVodafoneSignature(
      {
        merchantId: "M1",
        terminalId: "T1",
        amountCents: 100_000,
        currency: "EGP",
        merchantOrderId: "intent-1",
        msisdn: "+201234567890",
      },
      SECRET,
    );
    expect(sig).toMatch(/^[a-f0-9]{64}$/);

    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(
        "amountCents=100000&currency=EGP&merchantId=M1&merchantOrderId=intent-1&msisdn=+201234567890&terminalId=T1",
      )
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("changes when any field changes", () => {
    const a = computeVodafoneSignature(
      { merchantId: "M1", terminalId: "T1", amountCents: 1, currency: "EGP", merchantOrderId: "x", msisdn: "y" },
      SECRET,
    );
    const b = computeVodafoneSignature(
      { merchantId: "M1", terminalId: "T1", amountCents: 2, currency: "EGP", merchantOrderId: "x", msisdn: "y" },
      SECRET,
    );
    expect(a).not.toBe(b);
  });

  it("callback signature differs from initiate signature", () => {
    const init = computeVodafoneSignature(
      { merchantId: "M1", terminalId: "T1", amountCents: 1, currency: "EGP", merchantOrderId: "x", msisdn: "y" },
      SECRET,
    );
    const cb = computeVodafoneCallbackSignature(
      { merchantOrderId: "x", paymentId: "p1", status: "PAID", amountCents: 1 },
      SECRET,
    );
    expect(init).not.toBe(cb);
  });
});

describe("VodafoneCashAdapter", () => {
  function makeAdapter() {
    return new VodafoneCashAdapter({
      VODAFONE_CASH_MERCHANT_ID: "M1",
      VODAFONE_CASH_TERMINAL_ID: "T1",
      VODAFONE_CASH_SECRET: SECRET,
    } as unknown as NodeJS.ProcessEnv);
  }

  it("isConfigured when env vars set", () => {
    expect(makeAdapter().isConfigured).toBe(true);
  });

  it("not configured when missing terminal id", () => {
    expect(
      new VodafoneCashAdapter({
        VODAFONE_CASH_MERCHANT_ID: "M1",
        VODAFONE_CASH_SECRET: SECRET,
      } as unknown as NodeJS.ProcessEnv).isConfigured,
    ).toBe(false);
  });

  it("rejects callback with mismatched signature", () => {
    const adapter = makeAdapter();
    expect(
      adapter.verifyWebhook({
        headers: {},
        body: {
          merchant_order_id: "intent-1",
          payment_id: "p1",
          status: "PAID",
          amount_cents: 100,
          currency: "EGP",
          signature: "00".repeat(32),
        },
      }),
    ).toBeNull();
  });

  it("accepts callback with valid signature and projects to event", () => {
    const adapter = makeAdapter();
    const sig = computeVodafoneCallbackSignature(
      { merchantOrderId: "intent-7", paymentId: "p7", status: "PAID", amountCents: 50_000 },
      SECRET,
    );
    const event = adapter.verifyWebhook({
      headers: {},
      body: {
        merchant_order_id: "intent-7",
        payment_id: "p7",
        status: "PAID",
        amount_cents: 50_000,
        currency: "EGP",
        signature: sig,
      },
    });
    expect(event).not.toBeNull();
    expect(event!.intentId).toBe("intent-7");
    expect(event!.outcome).toBe("SUCCESS");
    expect(event!.amount).toBe(500); // 50,000 cents → 500 EGP
  });

  it("classifies failure when status is not PAID/SUCCESS", () => {
    const adapter = makeAdapter();
    const sig = computeVodafoneCallbackSignature(
      { merchantOrderId: "intent-9", paymentId: "p9", status: "FAILED", amountCents: 0 },
      SECRET,
    );
    const event = adapter.verifyWebhook({
      headers: {},
      body: {
        merchant_order_id: "intent-9",
        payment_id: "p9",
        status: "FAILED",
        amount_cents: 0,
        currency: "EGP",
        signature: sig,
      },
    });
    expect(event!.outcome).toBe("FAILED");
  });
});
