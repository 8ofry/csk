// Paymob webhook receiver.
//
// Paymob calls this endpoint after every transaction with an HMAC-signed
// payload. We never trust the raw body — `paymentAdapter().verifyWebhook()`
// validates signatures and projects to a normalized event before settlement.
//
// IMPORTANT: this handler is an open POST endpoint that mutates financial
// state. Trust comes only from the HMAC verification inside the adapter.

import { paymentAdapter } from "@/infrastructure/payments/factory";
import { settlePaymentIntent } from "@/application/payment-intents/service";
import { logger } from "@/infrastructure/observability/logger";
import { jsonError, jsonResponse } from "@/lib/api";

export async function POST(req: Request) {
  // Read once: we want raw body for HMAC + parsed body for adapter projection.
  const rawBody = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  const adapter = paymentAdapter();
  const event = adapter.verifyWebhook({ headers, body, rawBody });
  if (!event) {
    logger.warn("Rejected payment webhook (signature failed)", {
      tags: { provider: adapter.provider },
    });
    return jsonError("Invalid signature", 401);
  }

  if (!event.intentId) {
    return jsonError("Missing intentId", 400);
  }

  try {
    const result = await settlePaymentIntent(event.intentId, {
      outcome: event.outcome,
      raw: event.raw,
    });
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    logger.error("Failed to settle payment intent", {
      tags: { intentId: event.intentId, provider: adapter.provider },
      error: err,
    });
    return jsonError("Settlement failed", 500);
  }
}

// Some gateways probe with GET — answer 200 so health checks pass.
export async function GET() {
  return jsonResponse({ ok: true, hint: "Use POST for webhook delivery" });
}
