// Dev / fallback adapter — logs to console and returns a mock redirect URL
// pointing back to a local "simulate" page that POSTs a fake-success webhook.
// Lets the full intent → redirect → webhook → settle flow be exercised without
// real gateway credentials.

import {
  type PaymentAdapter,
  type PaymentInitiateInput,
  type PaymentInitiateResult,
  type WebhookEvent,
} from "./adapter";

export class ConsolePaymentAdapter implements PaymentAdapter {
  readonly provider = "console";
  readonly isConfigured = true;

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    console.info(
      `[payment/console] initiate intent=${input.intentId} amount=${input.amount} ${input.currency}`,
    );
    return {
      providerOrderId: `console-${input.intentId}`,
      redirectUrl: `/payments/simulate?intentId=${encodeURIComponent(input.intentId)}`,
      raw: { simulated: true },
    };
  }

  /**
   * Console adapter accepts any inbound payload — only enabled in dev.
   * We require an `x-csk-dev-payment-token` header that matches a known dev
   * value so the simulate page can fire a webhook from the browser without
   * exposing the endpoint to the public internet.
   */
  verifyWebhook(input: { headers: Record<string, string>; body: unknown }): WebhookEvent | null {
    if (process.env.NODE_ENV === "production") return null;
    const token = input.headers["x-csk-dev-payment-token"];
    if (token !== "dev-secret") return null;
    const body = input.body as
      | { intentId?: string; outcome?: string; amount?: number; currency?: string }
      | null;
    if (!body?.intentId) return null;
    return {
      intentId: body.intentId,
      outcome: body.outcome === "FAILED" ? "FAILED" : "SUCCESS",
      amount: body.amount ?? 0,
      currency: body.currency ?? "EGP",
      providerTransactionId: `console-tx-${Date.now()}`,
      raw: body,
    };
  }
}
