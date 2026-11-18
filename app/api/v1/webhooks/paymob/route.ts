import { handlePaymentWebhook } from "@/infrastructure/payments/webhook-handler";
import { jsonResponse } from "@/lib/api";

export async function POST(req: Request) {
  return handlePaymentWebhook(req, "paymob");
}

export async function GET() {
  return jsonResponse({ ok: true, provider: "paymob", hint: "Use POST for webhook delivery" });
}
