// GET /api/v1/me — current authenticated user profile.

import { prisma } from "@/infrastructure/db/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      role: true,
      email: true,
      phone: true,
      fullNameEn: true,
      fullNameAr: true,
      preferredLocale: true,
      timezone: true,
      profilePhotoUrl: true,
      parentManaged: true,
      parent: { select: { id: true, fullNameEn: true } },
      children: { select: { id: true, fullNameEn: true } },
      lastLoginAt: true,
    },
  });
  if (!user) return jsonResponse({ error: "Not found" }, { status: 404 });
  return jsonResponse({ user });
}
