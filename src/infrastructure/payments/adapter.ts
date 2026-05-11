// Payment-gateway adapter interface (NFR-MNT-02 / SRS §13.2 v2 scope).
// Provider-agnostic so we can ship Paymob first, then add Vodafone Cash and
// Fawry later without touching the application layer.

export interface PaymentInitiateInput {
  intentId: string; // our internal PaymentIntent id, used as integration's merchant_order_id
  amount: number; // in EGP, with 2-decimal precision
  currency: string; // "EGP"
  payer: {
    fullName: string;
    email: string;
    phone: string;
  };
  description: string;
  /** Where to send the user after payment (success or failure). */
  returnUrl: string;
}

export interface PaymentInitiateResult {
  /** URL the client redirects to (Paymob iframe, Vodafone redirect, etc.). */
  redirectUrl: string;
  /** Provider-side reference (Paymob order id, etc.). */
  providerOrderId: string;
  /** Raw payload for audit. */
  raw?: unknown;
}

export type WebhookOutcome = "SUCCESS" | "FAILED" | "PENDING" | "UNKNOWN";

export interface WebhookEvent {
  /** Trusted only after `verifyWebhook` returns this. */
  intentId: string; // matches our PaymentIntent.id
  outcome: WebhookOutcome;
  amount: number; // confirmed amount paid
  currency: string;
  providerTransactionId: string;
  raw: unknown;
}

export interface PaymentAdapter {
  /** Provider key for audit ("paymob", "console"). */
  readonly provider: string;
  /** True if this adapter has the credentials it needs to actually transact. */
  readonly isConfigured: boolean;
  /** Create a gateway order and return the redirect URL. */
  initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult>;
  /**
   * Verify the inbound webhook (HMAC, signature, etc.) and project it into
   * our normalized WebhookEvent. Returns null when the request can't be trusted.
   */
  verifyWebhook(input: {
    headers: Record<string, string>;
    body: unknown;
    rawBody?: string;
  }): WebhookEvent | null;
}
