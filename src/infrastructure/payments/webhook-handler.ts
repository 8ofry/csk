import { paymentAdapterFor } from "@/infrastructure/payments/factory";
import { settlePaymentIntent } from "@/application/payment-intents/service";
import { logger } from "@/infrastructure/observability/logger";
import { jsonError, jsonResponse } from "@/lib/api";

export async function handlePaymentWebhook(
  req: Request,
  provider: "paymob" | "fawry" | "vodafone-cash",
): Promise<Response> {
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

  const adapter = paymentAdapterFor(provider);
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
