import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/infrastructure/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const count = await prisma.location.count();
    return NextResponse.json({ ok: true, locationCount: count });
  } catch {
    return NextResponse.json({ ok: false, error: "Database check failed" }, { status: 500 });
  }
}
