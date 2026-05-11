// Paymob (Egypt) Accept gateway integration. Standard 3-step flow:
//   1. POST /api/auth/tokens                 → auth_token
//   2. POST /api/ecommerce/orders            → order_id
//   3. POST /api/acceptance/payment_keys     → payment_token
//      iframe URL = https://accept.paymob.com/api/acceptance/iframes/{IFRAME_ID}?payment_token={...}
//
// Webhooks are HMAC-signed (PAYMOB_HMAC_SECRET). The signature is computed over
// the alphabetized concatenation of the named "obj" fields per Paymob docs.
// Reference: https://docs.paymob.com/docs/accept-standard-redirect

import crypto from "node:crypto";
import {
  type PaymentAdapter,
  type PaymentInitiateInput,
  type PaymentInitiateResult,
  type WebhookEvent,
} from "./adapter";

const PAYMOB_BASE = "https://accept.paymob.com/api";

interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
}

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

export class PaymobAdapter implements PaymentAdapter {
  readonly provider = "paymob";
  private config: PaymobConfig | null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const apiKey = env.PAYMOB_API_KEY;
    const integrationId = env.PAYMOB_INTEGRATION_ID;
    const iframeId = env.PAYMOB_IFRAME_ID;
    const hmacSecret = env.PAYMOB_HMAC_SECRET;
    if (apiKey && integrationId && iframeId && hmacSecret) {
      this.config = { apiKey, integrationId, iframeId, hmacSecret };
    } else {
      this.config = null;
    }
  }

  get isConfigured(): boolean {
    return this.config !== null;
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    if (!this.config) throw new Error("Paymob not configured");
    const cfg = this.config;

    // 1. Auth
    const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: cfg.apiKey }),
    });
    if (!authRes.ok) throw new Error(`Paymob auth failed: ${authRes.status}`);
    const { token: authToken } = (await authRes.json()) as PaymobAuthResponse;

    // 2. Register order — amount in piastres (×100)
    const cents = Math.round(input.amount * 100);
    const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: cents,
        currency: input.currency,
        merchant_order_id: input.intentId, // our PaymentIntent id — comes back in the webhook
        items: [],
      }),
    });
    if (!orderRes.ok) throw new Error(`Paymob order failed: ${orderRes.status}`);
    const order = (await orderRes.json()) as PaymobOrderResponse;

    // 3. Payment key
    const billing = paymobBillingFromPayer(input.payer);
    const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: cents,
        expiration: 3600,
        order_id: order.id,
        billing_data: billing,
        currency: input.currency,
        integration_id: Number(cfg.integrationId),
        lock_order_when_paid: true,
      }),
    });
    if (!keyRes.ok) throw new Error(`Paymob payment_key failed: ${keyRes.status}`);
    const { token: paymentToken } = (await keyRes.json()) as PaymobPaymentKeyResponse;

    return {
      providerOrderId: String(order.id),
      redirectUrl: `${PAYMOB_BASE}/acceptance/iframes/${cfg.iframeId}?payment_token=${paymentToken}`,
      raw: { orderId: order.id, returnUrl: input.returnUrl },
    };
  }

  verifyWebhook(input: {
    headers: Record<string, string>;
    body: unknown;
    rawBody?: string;
  }): WebhookEvent | null {
    if (!this.config) return null;

    // Paymob may pass the HMAC as a query param or in the body.
    const body = input.body as { obj?: PaymobWebhookObj; hmac?: string } | null;
    if (!body || !body.obj || !body.hmac) return null;

    const expected = computePaymobHmac(body.obj, this.config.hmacSecret);
    if (!timingSafeEqual(expected, body.hmac)) return null;

    return {
      intentId: String(body.obj.order?.merchant_order_id ?? ""),
      outcome: body.obj.success ? "SUCCESS" : "FAILED",
      amount: typeof body.obj.amount_cents === "number" ? body.obj.amount_cents / 100 : 0,
      currency: body.obj.currency ?? "EGP",
      providerTransactionId: String(body.obj.id ?? ""),
      raw: body,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HMAC computation (extracted for unit testing without making network calls).
// ────────────────────────────────────────────────────────────────────────────

export interface PaymobWebhookObj {
  amount_cents?: number;
  created_at?: string;
  currency?: string;
  error_occured?: boolean;
  has_parent_transaction?: boolean;
  id?: number;
  integration_id?: number;
  is_3d_secure?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_refunded?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  order?: { id?: number; merchant_order_id?: string };
  owner?: number;
  pending?: boolean;
  source_data?: { pan?: string; sub_type?: string; type?: string };
  success?: boolean;
}

/**
 * Per Paymob: concatenate the listed fields in the documented alphabetical order
 * (with `order.id`, `source_data.*` etc. flattened) then HMAC-SHA512 with the
 * merchant secret. The webhook arrives carrying the resulting hex digest.
 */
export function computePaymobHmac(obj: PaymobWebhookObj, secret: string): string {
  const parts: string[] = [
    str(obj.amount_cents),
    str(obj.created_at),
    str(obj.currency),
    str(obj.error_occured),
    str(obj.has_parent_transaction),
    str(obj.id),
    str(obj.integration_id),
    str(obj.is_3d_secure),
    str(obj.is_auth),
    str(obj.is_capture),
    str(obj.is_refunded),
    str(obj.is_standalone_payment),
    str(obj.is_voided),
    str(obj.order?.id),
    str(obj.owner),
    str(obj.pending),
    str(obj.source_data?.pan),
    str(obj.source_data?.sub_type),
    str(obj.source_data?.type),
    str(obj.success),
  ];
  return crypto.createHmac("sha512", secret).update(parts.join("")).digest("hex");
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function paymobBillingFromPayer(payer: PaymentInitiateInput["payer"]) {
  const [first = "", ...rest] = payer.fullName.split(" ");
  const last = rest.join(" ") || "—";
  return {
    apartment: "NA",
    email: payer.email,
    floor: "NA",
    first_name: first || "—",
    street: "NA",
    building: "NA",
    phone_number: payer.phone,
    shipping_method: "NA",
    postal_code: "NA",
    city: "Benha",
    country: "EG",
    last_name: last,
    state: "NA",
  };
}
