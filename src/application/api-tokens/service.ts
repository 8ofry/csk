// API token issuance + verification (used by the v2 mobile app).
// Tokens are random 32-byte URL-safe strings; we persist only their SHA-256
// hash so a database leak does not expose live tokens.

import crypto from "node:crypto";
import { prisma } from "@/infrastructure/db/prisma";

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_DAYS = 90;

export interface IssuedToken {
  id: string;
  /** Raw token — only returned once at issue. */
  token: string;
  prefix: string;
  expiresAt: Date;
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function issueToken(opts: {
  userId: string;
  label?: string;
  expiresInDays?: number;
}): Promise<IssuedToken> {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(
    Date.now() + (opts.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
  );
  const created = await prisma.apiToken.create({
    data: {
      userId: opts.userId,
      tokenHash: hashToken(raw),
      tokenPrefix: raw.slice(0, 8),
      label: opts.label ?? null,
      expiresAt,
    },
  });
  return { id: created.id, token: raw, prefix: created.tokenPrefix ?? "", expiresAt };
}

export interface TokenVerification {
  userId: string;
  tokenId: string;
  /** Whether `lastUsedAt` was bumped on this verify. */
  touched: boolean;
}

export async function verifyToken(raw: string): Promise<TokenVerification | null> {
  if (!raw || raw.length < 16) return null;
  const hash = hashToken(raw);
  const row = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  // Best-effort touch — fail-open if it can't write (read-replica scenarios).
  try {
    await prisma.apiToken.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });
    return { userId: row.userId, tokenId: row.id, touched: true };
  } catch {
    return { userId: row.userId, tokenId: row.id, touched: false };
  }
}

export async function revokeToken(tokenId: string, actorUserId: string) {
  // Allow the owning user (or staff) to revoke. Caller has already enforced.
  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId: actorUserId,
      action: "api-token.revoke",
      entityType: "ApiToken",
      entityId: tokenId,
    },
  });
}

export async function listTokensForUser(userId: string) {
  return prisma.apiToken.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      tokenPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}
