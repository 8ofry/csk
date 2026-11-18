import { handlePaymentWebhook } from "@/infrastructure/payments/webhook-handler";
import { jsonResponse } from "@/lib/api";

export async function POST(req: Request) {
  return handlePaymentWebhook(req, "vodafone-cash");
}

export async function GET() {
  return jsonResponse({
    ok: true,
    provider: "vodafone-cash",
    hint: "Use POST for webhook delivery",
  });
}
