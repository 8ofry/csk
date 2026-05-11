// Vodafone Cash (Egypt) — direct mobile-wallet integration scaffold.
//
// In practice many Egyptian merchants route Vodafone Cash through Paymob's
// payment-method ID (already supported via PaymobAdapter). This adapter is the
// fallback for direct integrations: register a payment, customer enters their
// wallet PIN on the Vodafone screen, gateway POSTs back a signed callback.
//
// Status: signature + flow scaffold against the documented Mobile Payment
// Gateway shape. Live calls require sandbox credentials from Vodafone Cash
// merchant onboarding — set the VODAFONE_CASH_* env vars to enable.

import crypto from "node:crypto";
import {
  type PaymentAdapter,
  type PaymentInitiateInput,
  type PaymentInitiateResult,
  type WebhookEvent,
} from "./adapter";

interface VodafoneConfig {
  baseUrl: string;
  merchantId: string;
  terminalId: string;
  secretKey: string;
}

export class VodafoneCashAdapter implements PaymentAdapter {
  readonly provider = "vodafone-cash";
  private config: VodafoneConfig | null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const merchantId = env.VODAFONE_CASH_MERCHANT_ID;
    const terminalId = env.VODAFONE_CASH_TERMINAL_ID;
    const secretKey = env.VODAFONE_CASH_SECRET;
    const baseUrl = env.VODAFONE_CASH_BASE_URL ?? "https://api.vodafone.com.eg/payments";
    if (merchantId && terminalId && secretKey) {
      this.config = { merchantId, terminalId, secretKey, baseUrl };
    } else {
      this.config = null;
    }
  }

  get isConfigured(): boolean {
    return this.config !== null;
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    if (!this.config) throw new Error("Vodafone Cash not configured");
    const cfg = this.config;

    const cents = Math.round(input.amount * 100);
    const requestId = `csk-${input.intentId}`;
    const signature = computeVodafoneSignature(
      {
        merchantId: cfg.merchantId,
        terminalId: cfg.terminalId,
        amountCents: cents,
        currency: input.currency,
        merchantOrderId: input.intentId,
        msisdn: input.payer.phone,
      },
      cfg.secretKey,
    );

    // The actual endpoint name varies by Vodafone integration tier; this is the
    // Mobile Payment Gateway "createPayment" shape. When running for real,
    // Vodafone returns a payment URL the customer opens to confirm with PIN.
    const res = await fetch(`${cfg.baseUrl}/v1/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchant_id: cfg.merchantId,
        terminal_id: cfg.terminalId,
        amount_cents: cents,
        currency: input.currency,
        merchant_order_id: input.intentId,
        msisdn: input.payer.phone,
        request_id: requestId,
        return_url: input.returnUrl,
        signature,
      }),
    });
    if (!res.ok) throw new Error(`Vodafone Cash createPayment failed: ${res.status}`);
    const body = (await res.json()) as { redirect_url?: string; payment_id?: string };
    if (!body.redirect_url || !body.payment_id) {
      throw new Error("Vodafone Cash response missing redirect_url / payment_id");
    }
    return {
      providerOrderId: body.payment_id,
      redirectUrl: body.redirect_url,
      raw: body,
    };
  }

  verifyWebhook(input: {
    headers: Record<string, string>;
    body: unknown;
    rawBody?: string;
  }): WebhookEvent | null {
    if (!this.config) return null;
    const body = input.body as
      | {
          merchant_order_id?: string;
          payment_id?: string;
          status?: string;
          amount_cents?: number;
          currency?: string;
          signature?: string;
        }
      | null;
    if (!body || !body.signature || !body.merchant_order_id) return null;

    const expected = computeVodafoneCallbackSignature(
      {
        merchantOrderId: body.merchant_order_id,
        paymentId: body.payment_id ?? "",
        status: body.status ?? "",
        amountCents: body.amount_cents ?? 0,
      },
      this.config.secretKey,
    );
    if (!timingSafeEqual(expected, body.signature)) return null;

    return {
      intentId: body.merchant_order_id,
      outcome: body.status === "PAID" || body.status === "SUCCESS" ? "SUCCESS" : "FAILED",
      amount: typeof body.amount_cents === "number" ? body.amount_cents / 100 : 0,
      currency: body.currency ?? "EGP",
      providerTransactionId: body.payment_id ?? "",
      raw: body,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Signature helpers (extracted for unit testing).
// ────────────────────────────────────────────────────────────────────────────

export interface VodafoneInitiateSig {
  merchantId: string;
  terminalId: string;
  amountCents: number;
  currency: string;
  merchantOrderId: string;
  msisdn: string;
}

export function computeVodafoneSignature(p: VodafoneInitiateSig, secret: string): string {
  // Concatenation order is documented by Vodafone payment gateway integration
  // packs. We follow the typical shape: keys sorted alphabetically + secret.
  const payload = [
    `amountCents=${p.amountCents}`,
    `currency=${p.currency}`,
    `merchantId=${p.merchantId}`,
    `merchantOrderId=${p.merchantOrderId}`,
    `msisdn=${p.msisdn}`,
    `terminalId=${p.terminalId}`,
  ].join("&");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export interface VodafoneCallbackSig {
  merchantOrderId: string;
  paymentId: string;
  status: string;
  amountCents: number;
}

export function computeVodafoneCallbackSignature(
  p: VodafoneCallbackSig,
  secret: string,
): string {
  const payload = [
    `amountCents=${p.amountCents}`,
    `merchantOrderId=${p.merchantOrderId}`,
    `paymentId=${p.paymentId}`,
    `status=${p.status}`,
  ].join("&");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
