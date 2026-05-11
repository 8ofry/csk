// Helper to wrap a request handler with rate limiting + standard 429 response.

import type { RateLimitConfig } from "@/domain/rate-limit/token-bucket";
import { rateLimitStore } from "@/infrastructure/rate-limit/store";
import { clientIp } from "@/lib/client-ip";
import { jsonResponse } from "@/lib/api";

export interface RateLimitOptions {
  bucket: string; // namespace, e.g. "public:contact"
  config: RateLimitConfig;
}

/**
 * Returns a Response (HTTP 429) when the IP is rate-limited; null when allowed.
 * Caller proceeds with the real handler when null.
 */
export async function checkRateLimit(
  req: Request,
  opts: RateLimitOptions,
): Promise<Response | null> {
  const ip = clientIp(req);
  const key = `${opts.bucket}:${ip}`;
  const decision = await rateLimitStore.check(key, opts.config);

  if (decision.allowed) return null;

  return jsonResponse(
    {
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: decision.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "retry-after": String(decision.retryAfterSeconds),
        "x-ratelimit-remaining": "0",
      },
    },
  );
}
