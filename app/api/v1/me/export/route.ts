import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { authenticate } from "@/lib/api-auth";
import { jsonError } from "@/lib/api";
import { exportUserPersonalData } from "@/application/users/gdpr";

export async function GET(req: Request) {
  const session = await auth();
  const apiUser = session?.user?.id ? null : await authenticate(req);
  const userId = session?.user?.id ?? apiUser?.id;

  if (!userId) return jsonError("Unauthenticated", 401);

  const payload = await exportUserPersonalData(userId);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="csk-personal-data-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
