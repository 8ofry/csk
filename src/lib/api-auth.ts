// API auth helper for /api/v1/* routes used by the v2 mobile app.
// Looks for `Authorization: Bearer <token>` and returns the associated user
// (with role for RBAC), or a 401 Response.

import { prisma } from "@/infrastructure/db/prisma";
import { verifyToken } from "@/application/api-tokens/service";
import { jsonError } from "@/lib/api";
import type { UserRole } from "@prisma/client";

export interface ApiUser {
  id: string;
  role: UserRole;
  email: string;
  fullNameEn: string;
  fullNameAr: string;
  preferredLocale: string;
}

function extractBearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice("bearer ".length).trim() || null;
}

export async function authenticate(req: Request): Promise<ApiUser | null> {
  const raw = extractBearer(req);
  if (!raw) return null;
  const verified = await verifyToken(raw);
  if (!verified) return null;
  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      role: true,
      email: true,
      fullNameEn: true,
      fullNameAr: true,
      preferredLocale: true,
      status: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    fullNameEn: user.fullNameEn,
    fullNameAr: user.fullNameAr,
    preferredLocale: user.preferredLocale,
  };
}

/** Return the authed user OR a 401 response. */
export async function requireApiUser(
  req: Request,
): Promise<{ user: ApiUser } | { response: Response }> {
  const user = await authenticate(req);
  if (!user) return { response: jsonError("Unauthenticated", 401) };
  return { user };
}

/** Return the authed user OR a 403 response when role is below `minimum`. */
export async function requireApiRole(
  req: Request,
  minimum: UserRole,
): Promise<{ user: ApiUser } | { response: Response }> {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth;
  if (!isAtLeast(auth.user.role, minimum)) {
    return { response: jsonError(`Requires ${minimum} role`, 403) };
  }
  return { user: auth.user };
}

const RANK: Record<UserRole, number> = {
  ADMIN: 5,
  HEAD_COACH: 4,
  COACH: 3,
  INTERN: 2,
  TRAINEE: 1,
};

function isAtLeast(role: UserRole, minimum: UserRole): boolean {
  return RANK[role] >= RANK[minimum];
}
