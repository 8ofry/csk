// Fawry (Egypt) — reference-number gateway.
//
// Fawry's flow differs from Paymob/Vodafone: instead of a redirect, the
// customer gets a 9-digit reference code that they pay at any Fawry kiosk,
// supermarket, or via the Fawry app within an expiry window. The merchant
// gets a webhook ("FawryServerNotification") on settlement.
//
// Fawry signatures are SHA-256 over a documented field concatenation
// (no separators) — see https://developer.fawrystaging.com.

import crypto from "node:crypto";
import {
  type PaymentAdapter,
  type PaymentInitiateInput,
  type PaymentInitiateResult,
  type WebhookEvent,
} from "./adapter";

interface FawryConfig {
  baseUrl: string;
  merchantCode: string;
  securityKey: string;
}

export class FawryAdapter implements PaymentAdapter {
  readonly provider = "fawry";
  private config: FawryConfig | null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const merchantCode = env.FAWRY_MERCHANT_CODE;
    const securityKey = env.FAWRY_SECURITY_KEY;
    const baseUrl = env.FAWRY_BASE_URL ?? "https://www.atfawry.com/ECommerceWeb/Fawry/payments";
    if (merchantCode && securityKey) {
      this.config = { merchantCode, securityKey, baseUrl };
    } else {
      this.config = null;
    }
  }

  get isConfigured(): boolean {
    return this.config !== null;
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    if (!this.config) throw new Error("Fawry not configured");
    const cfg = this.config;

    const merchantRefNum = input.intentId;
    const customerProfileId = input.payer.email; // Fawry accepts arbitrary string id
    const items = [
      {
        itemId: `csk-${input.intentId.slice(0, 8)}`,
        description: input.description,
        price: input.amount,
        quantity: 1,
      },
    ];
    const signature = computeFawryChargeSignature(
      {
        merchantCode: cfg.merchantCode,
        merchantRefNum,
        customerProfileId,
        paymentMethod: "PAYATFAWRY",
        amount: input.amount,
        items,
      },
      cfg.securityKey,
    );

    const res = await fetch(`${cfg.baseUrl}/charge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchantCode: cfg.merchantCode,
        merchantRefNum,
        customerProfileId,
        customerName: input.payer.fullName,
        customerEmail: input.payer.email,
        customerMobile: input.payer.phone,
        paymentMethod: "PAYATFAWRY",
        amount: input.amount,
        currencyCode: input.currency,
        chargeItems: items,
        signature,
        description: input.description,
      }),
    });
    if (!res.ok) throw new Error(`Fawry charge failed: ${res.status}`);
    const body = (await res.json()) as {
      referenceNumber?: string;
      expirationTime?: number;
      statusCode?: number;
      statusDescription?: string;
    };
    if (!body.referenceNumber) {
      throw new Error(`Fawry charge missing reference: ${body.statusDescription ?? "unknown"}`);
    }

    // Fawry "redirect" is a thank-you page that displays the reference code.
    // We host our own at /payments/fawry-reference?intent=...&ref=...
    const redirectUrl = `${input.returnUrl}&fawry_ref=${body.referenceNumber}`;
    return {
      providerOrderId: body.referenceNumber,
      redirectUrl,
      raw: body,
    };
  }

  verifyWebhook(input: { headers: Record<string, string>; body: unknown }): WebhookEvent | null {
    if (!this.config) return null;
    const body = input.body as
      | {
          merchantRefNumber?: string;
          fawryRefNumber?: string;
          orderStatus?: string;
          paymentAmount?: number;
          paymentMethod?: string;
          messageSignature?: string;
        }
      | null;
    if (!body || !body.merchantRefNumber || !body.messageSignature) return null;

    const expected = computeFawryNotificationSignature(
      {
        merchantRefNumber: body.merchantRefNumber,
        fawryRefNumber: body.fawryRefNumber ?? "",
        paymentAmount: body.paymentAmount ?? 0,
        orderStatus: body.orderStatus ?? "",
        paymentMethod: body.paymentMethod ?? "",
      },
      this.config.securityKey,
    );
    if (!timingSafeEqual(expected, body.messageSignature)) return null;

    return {
      intentId: body.merchantRefNumber,
      outcome: body.orderStatus === "PAID" ? "SUCCESS" : body.orderStatus === "EXPIRED" ? "FAILED" : "PENDING",
      amount: body.paymentAmount ?? 0,
      currency: "EGP",
      providerTransactionId: body.fawryRefNumber ?? "",
      raw: body,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Fawry signature helpers
// ────────────────────────────────────────────────────────────────────────────

export interface FawryChargeItem {
  itemId: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface FawryChargeSig {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId: string;
  paymentMethod: string;
  amount: number;
  items: FawryChargeItem[];
}

/**
 * Charge-request signature per Fawry docs:
 *   merchantCode + merchantRefNum + customerProfileId + paymentMethod +
 *   amount(2dp) + (itemId + quantity + price(2dp))[*] + securityKey
 * Plain SHA-256, hex-encoded.
 */
export function computeFawryChargeSignature(p: FawryChargeSig, securityKey: string): string {
  const itemPart = p.items
    .map((it) => `${it.itemId}${it.quantity}${it.price.toFixed(2)}`)
    .join("");
  const payload = `${p.merchantCode}${p.merchantRefNum}${p.customerProfileId}${p.paymentMethod}${p.amount.toFixed(2)}${itemPart}${securityKey}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export interface FawryNotificationSig {
  merchantRefNumber: string;
  fawryRefNumber: string;
  paymentAmount: number;
  orderStatus: string;
  paymentMethod: string;
}

/**
 * Server-notification signature:
 *   merchantRefNumber + fawryRefNumber + paymentAmount(2dp) + orderStatus +
 *   paymentMethod + securityKey
 */
export function computeFawryNotificationSignature(
  p: FawryNotificationSig,
  securityKey: string,
): string {
  const payload = `${p.merchantRefNumber}${p.fawryRefNumber}${p.paymentAmount.toFixed(2)}${p.orderStatus}${p.paymentMethod}${securityKey}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
