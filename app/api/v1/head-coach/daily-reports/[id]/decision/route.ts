// POST /api/v1/head-coach/daily-reports/:id/decision
// Body: { decision: "approve" | "reject", comment?: string }

import { z } from "zod";
import { headers } from "next/headers";
import {
  approveDailyReport,
  rejectDailyReport,
} from "@/application/daily-reports/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonError, jsonResponse } from "@/lib/api";

async function appUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

const inputSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve") }),
  z.object({ decision: z.literal("reject"), comment: z.string().min(3) }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(req, "HEAD_COACH");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    if (parsed.data.decision === "approve") {
      const report = await approveDailyReport(id, auth.user.id, await appUrl());
      return jsonResponse({ ok: true, report });
    }
    const report = await rejectDailyReport(id, auth.user.id, parsed.data.comment);
    return jsonResponse({ ok: true, report });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Decision failed");
  }
}
