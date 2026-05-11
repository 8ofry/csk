// Attendance service (FR-ATT-01..03).
// Coach marks present / late / absent / excused per trainee per session.
// FR-ATT-02: editable by coach until DailyReport submitted; after that, only Head Coach edits.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

export const attendanceStatusSchema = z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]);
export type AttendanceMark = z.infer<typeof attendanceStatusSchema>;

export const bulkMarkSchema = z.object({
  sessionId: z.string().min(1),
  marks: z.array(
    z.object({
      traineeId: z.string().min(1),
      status: attendanceStatusSchema,
      arrivalTime: z.coerce.date().nullable().optional(),
    }),
  ),
});

export class AttendanceLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceLockError";
  }
}

export async function bulkMarkAttendance(input: {
  sessionId: string;
  marks: { traineeId: string; status: AttendanceMark; arrivalTime?: Date | null }[];
  actorId: string;
  actorRole: "COACH" | "HEAD_COACH" | "ADMIN";
}) {
  const { sessionId, marks, actorId, actorRole } = input;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, dailyReport: { select: { id: true, status: true } } },
  });
  if (!session) throw new AttendanceLockError("Session not found");

  const reportSubmitted =
    session.dailyReport &&
    (session.dailyReport.status === "PENDING" ||
      session.dailyReport.status === "APPROVED");

  if (reportSubmitted && actorRole === "COACH") {
    throw new AttendanceLockError(
      "Daily report already submitted; only Head Coach can edit attendance now (FR-ATT-02).",
    );
  }

  return prisma.$transaction(async (tx) => {
    for (const m of marks) {
      await tx.attendance.upsert({
        where: { sessionId_traineeId: { sessionId, traineeId: m.traineeId } },
        create: {
          sessionId,
          traineeId: m.traineeId,
          status: m.status,
          arrivalTime: m.arrivalTime ?? null,
          markedById: actorId,
        },
        update: {
          status: m.status,
          arrivalTime: m.arrivalTime ?? null,
          markedById: actorId,
          markedAt: new Date(),
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId,
        action: "attendance.bulk-mark",
        entityType: "Session",
        entityId: sessionId,
        changes: { count: marks.length },
      },
    });
  });
}

/** FR-ATT-03: attendance rate per trainee in a date window. */
export async function attendanceRateForTrainee(
  traineeId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<{ total: number; attended: number; rate: number }> {
  const rows = await prisma.attendance.findMany({
    where: {
      traineeId,
      session: { scheduledStart: { gte: windowStart, lte: windowEnd } },
    },
    select: { status: true },
  });
  const total = rows.length;
  const attended = rows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return { total, attended, rate: total === 0 ? 0 : attended / total };
}
