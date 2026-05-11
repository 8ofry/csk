import { contactInputSchema, submitContact } from "@/application/public/contact";
import { jsonError, jsonResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { RATE_LIMITS } from "@/infrastructure/rate-limit/store";

// POST /api/v1/public/contact — accepts JSON body
// {name, email, phone?, subject?, message}
// Rate-limited to 5/hour per IP.
export async function POST(req: Request) {
  const limited = await checkRateLimit(req, {
    bucket: "public:contact",
    config: RATE_LIMITS.publicContact,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = contactInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }
  await submitContact(parsed.data);
  return jsonResponse({ ok: true }, { status: 202 });
}
