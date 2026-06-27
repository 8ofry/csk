import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// NFR-SEC-01..06: production-grade response headers.
// CSP is intentionally permissive for dev (allows inline style for tailwind/turbopack
// devtools) but tight in production.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // Next.js + react-pdf font registration uses jsdelivr / Google Fonts.
  "img-src 'self' data: https:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  // Tailwind injects a small inline style + Next runtime needs eval in dev.
  `style-src 'self' 'unsafe-inline'`,
  isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    : `script-src 'self' 'unsafe-inline'`,
  "connect-src 'self' https://cdn.jsdelivr.net",
  "form-action 'self'",
  "frame-src 'self' https://www.youtube.com https://*.youtube.com https://player.vimeo.com https://*.vimeo.com",
];

const securityHeaders: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      // Configure once R2/S3 bucket domain is known
      // { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  async headers() {
    return [
      {
        // Apply to every route — pages + API.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
