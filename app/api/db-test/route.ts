import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";

export async function GET() {
  try {
    // Attempt a simple database query
    const count = await prisma.location.count();
    return NextResponse.json({ ok: true, locationCount: count });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; clientVersion?: string };
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
        stack: error?.stack || null,
        code: error?.code || null,
        clientVersion: error?.clientVersion || null,
      },
      { status: 500 }
    );
  }
}
