import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET || "fallback-secret-for-dev-csk";

export function generateVerificationToken(email: string): string {
  const payload = Buffer.from(email).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyVerificationToken(token: string): string | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    
    const expectedSignature = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (signature !== expectedSignature) return null;
    
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}
