import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  computeFawryChargeSignature,
  computeFawryNotificationSignature,
  FawryAdapter,
} from "@/infrastructure/payments/fawry";

const SECURITY_KEY = "fawry-test-security-key";

describe("Fawry signature helpers", () => {
  it("charge signature matches the documented concatenation", () => {
    const sig = computeFawryChargeSignature(
      {
        merchantCode: "MC1",
        merchantRefNum: "intent-1",
        customerProfileId: "cust@x.eg",
        paymentMethod: "PAYATFAWRY",
        amount: 100.5,
        items: [{ itemId: "item-1", price: 100.5, quantity: 1 }],
      },
      SECURITY_KEY,
    );
    const expected = crypto
      .createHash("sha256")
      .update(`MC1intent-1cust@x.egPAYATFAWRY100.50item-11100.50${SECURITY_KEY}`)
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("multiple items concatenate in order", () => {
    const sig = computeFawryChargeSignature(
      {
        merchantCode: "MC1",
        merchantRefNum: "intent-1",
        customerProfileId: "x",
        paymentMethod: "PAYATFAWRY",
        amount: 250,
        items: [
          { itemId: "a", price: 100, quantity: 1 },
          { itemId: "b", price: 75, quantity: 2 },
        ],
      },
      SECURITY_KEY,
    );
    const expected = crypto
      .createHash("sha256")
      .update(`MC1intent-1xPAYATFAWRY250.00a1100.00b275.00${SECURITY_KEY}`)
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("notification signature matches docs", () => {
    const sig = computeFawryNotificationSignature(
      {
        merchantRefNumber: "intent-1",
        fawryRefNumber: "987654321",
        paymentAmount: 100.5,
        orderStatus: "PAID",
        paymentMethod: "PAYATFAWRY",
      },
      SECURITY_KEY,
    );
    const expected = crypto
      .createHash("sha256")
      .update(`intent-1987654321100.50PAIDPAYATFAWRY${SECURITY_KEY}`)
      .digest("hex");
    expect(sig).toBe(expected);
  });
});

describe("FawryAdapter", () => {
  function makeAdapter() {
    return new FawryAdapter({
      FAWRY_MERCHANT_CODE: "MC1",
      FAWRY_SECURITY_KEY: SECURITY_KEY,
    } as unknown as NodeJS.ProcessEnv);
  }

  it("isConfigured with both required vars", () => {
    expect(makeAdapter().isConfigured).toBe(true);
  });

  it("not configured without security key", () => {
    expect(
      new FawryAdapter({ FAWRY_MERCHANT_CODE: "MC1" } as unknown as NodeJS.ProcessEnv).isConfigured,
    ).toBe(false);
  });

  it("rejects notification with bad signature", () => {
    const adapter = makeAdapter();
    expect(
      adapter.verifyWebhook({
        headers: {},
        body: {
          merchantRefNumber: "i1",
          fawryRefNumber: "f1",
          paymentAmount: 100,
          orderStatus: "PAID",
          paymentMethod: "PAYATFAWRY",
          messageSignature: "not-the-real-signature",
        },
      }),
    ).toBeNull();
  });

  it("accepts notification + projects PAID → SUCCESS", () => {
    const adapter = makeAdapter();
    const sig = computeFawryNotificationSignature(
      {
        merchantRefNumber: "intent-x",
        fawryRefNumber: "fawry-99",
        paymentAmount: 600,
        orderStatus: "PAID",
        paymentMethod: "PAYATFAWRY",
      },
      SECURITY_KEY,
    );
    const event = adapter.verifyWebhook({
      headers: {},
      body: {
        merchantRefNumber: "intent-x",
        fawryRefNumber: "fawry-99",
        paymentAmount: 600,
        orderStatus: "PAID",
        paymentMethod: "PAYATFAWRY",
        messageSignature: sig,
      },
    });
    expect(event!.intentId).toBe("intent-x");
    expect(event!.outcome).toBe("SUCCESS");
    expect(event!.amount).toBe(600);
  });

  it("EXPIRED → FAILED, NEW → PENDING", () => {
    const adapter = makeAdapter();
    for (const [status, outcome] of [
      ["EXPIRED", "FAILED"],
      ["NEW", "PENDING"],
    ] as const) {
      const sig = computeFawryNotificationSignature(
        { merchantRefNumber: "i", fawryRefNumber: "", paymentAmount: 0, orderStatus: status, paymentMethod: "" },
        SECURITY_KEY,
      );
      const event = adapter.verifyWebhook({
        headers: {},
        body: {
          merchantRefNumber: "i",
          fawryRefNumber: "",
          paymentAmount: 0,
          orderStatus: status,
          paymentMethod: "",
          messageSignature: sig,
        },
      });
      expect(event!.outcome).toBe(outcome);
    }
  });
});
