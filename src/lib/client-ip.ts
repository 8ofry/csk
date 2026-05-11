// Extract the originating client IP from a Request.
// Trusts standard reverse-proxy headers in this order:
//   x-forwarded-for (first IP) > x-real-ip > cf-connecting-ip
// Falls back to "unknown" so rate-limit keys are still grouped per-process.

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}
