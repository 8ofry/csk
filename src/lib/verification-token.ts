import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dev-only-csk-verification-secret";
}

export function generateVerificationToken(email: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: now + TOKEN_TTL_MS })).toString(
    "base64url",
  );
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyVerificationToken(token: string, now = Date.now()): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    if (!payload || !signature) return null;

    const expectedSignature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: unknown;
      exp?: unknown;
    };
    if (typeof decoded.email !== "string" || typeof decoded.exp !== "number") return null;
    if (now > decoded.exp) return null;
    return decoded.email;
  } catch {
    return null;
  }
}
