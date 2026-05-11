// POST /api/v1/auth/logout — revokes the bearer token used for the call.

import { prisma } from "@/infrastructure/db/prisma";
import { hashToken } from "@/application/api-tokens/service";
import { jsonError, jsonResponse } from "@/lib/api";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return jsonError("Unauthenticated", 401);
  const raw = auth.slice("bearer ".length).trim();
  if (!raw) return jsonError("Unauthenticated", 401);

  const row = await prisma.apiToken.update({
    where: { tokenHash: hashToken(raw) },
    data: { revokedAt: new Date() },
    select: { id: true, userId: true },
  }).catch(() => null);

  if (!row) return jsonError("Token not found", 404);

  await prisma.auditLog.create({
    data: {
      actorId: row.userId,
      action: "api-token.logout",
      entityType: "ApiToken",
      entityId: row.id,
    },
  });

  return jsonResponse({ ok: true });
}
