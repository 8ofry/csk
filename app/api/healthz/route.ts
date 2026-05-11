// Liveness + readiness probe for load balancers / uptime monitors.
// Reports app version, current timestamp, and database round-trip status.

import { prisma } from "@/infrastructure/db/prisma";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus: "up" | "down" = "down";
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "up";
  } catch {
    // dbStatus already "down"
  }

  const overall: "ok" | "degraded" = dbStatus === "up" ? "ok" : "degraded";
  return jsonResponse(
    {
      status: overall,
      version: process.env.APP_VERSION ?? "0.1.0",
      uptimeSeconds: Math.floor(process.uptime()),
      now: new Date().toISOString(),
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
      respondedInMs: Date.now() - startedAt,
    },
    {
      status: overall === "ok" ? 200 : 503,
    },
  );
}
