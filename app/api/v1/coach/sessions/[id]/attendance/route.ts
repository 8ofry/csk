// POST /api/v1/coach/sessions/:id/attendance
// Body: { marks: [{ traineeId, status, arrivalTime? }] }

import { z } from "zod";
import {
  attendanceStatusSchema,
  bulkMarkAttendance,
} from "@/application/attendance/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonError, jsonResponse } from "@/lib/api";

const inputSchema = z.object({
  marks: z
    .array(
      z.object({
        traineeId: z.string().min(1),
        status: attendanceStatusSchema,
        arrivalTime: z.string().datetime().nullable().optional(),
      }),
    )
    .min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;
  const { id: sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    await bulkMarkAttendance({
      sessionId,
      marks: parsed.data.marks.map((m) => ({
        traineeId: m.traineeId,
        status: m.status,
        arrivalTime: m.arrivalTime ? new Date(m.arrivalTime) : null,
      })),
      actorId: auth.user.id,
      actorRole:
        auth.user.role === "ADMIN" || auth.user.role === "HEAD_COACH" ? auth.user.role : "COACH",
    });
    return jsonResponse({ ok: true, marked: parsed.data.marks.length });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to mark attendance");
  }
}
