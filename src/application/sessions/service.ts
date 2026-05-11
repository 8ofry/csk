// Sessions service (FR-SES, FR-ATT).
// Sessions are derived from group schedules + materialized into a Session row
// when the coach starts the session (or proactively, ahead of time).

import { prisma } from "@/infrastructure/db/prisma";
import {
  iterateOccurrences,
  scheduledOccurrence,
  type WeeklySchedule,
} from "@/domain/sessions/schedule";

export class SessionStartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionStartError";
  }
}

interface DerivedOccurrence {
  groupId: string;
  groupName: string;
  locationId: string;
  locationName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  /** Existing materialized Session, if any. */
  sessionId?: string;
  status?: string;
}

/**
 * Returns scheduled occurrences for a coach across a date window.
 * Combines:
 *   - Groups where the coach is the primary
 *   - The recurring schedule projected onto the window
 *   - Any existing materialized Session rows (so we don't create duplicates)
 */
export async function listScheduledForCoach(
  coachId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<DerivedOccurrence[]> {
  const groups = await prisma.group.findMany({
    where: { primaryCoachId: coachId, active: true },
    include: { location: { select: { id: true, nameEn: true } } },
  });

  const occurrences: DerivedOccurrence[] = [];
  for (const g of groups) {
    const schedule = g.schedule as unknown as WeeklySchedule | null;
    if (!schedule?.days?.length) continue;
    for (const occ of iterateOccurrences(schedule, windowStart, windowEnd)) {
      occurrences.push({
        groupId: g.id,
        groupName: g.name,
        locationId: g.locationId,
        locationName: g.location.nameEn,
        scheduledStart: occ.start,
        scheduledEnd: occ.end,
      });
    }
  }

  if (occurrences.length === 0) return [];

  // Match against existing Session rows
  const existing = await prisma.session.findMany({
    where: {
      coachId,
      scheduledStart: {
        gte: occurrences[0]!.scheduledStart,
        lte: occurrences[occurrences.length - 1]!.scheduledEnd,
      },
    },
    select: { id: true, groupId: true, scheduledStart: true, status: true },
  });

  const existingByKey = new Map<string, { id: string; status: string }>();
  for (const s of existing) {
    existingByKey.set(`${s.groupId}|${s.scheduledStart.toISOString()}`, {
      id: s.id,
      status: s.status,
    });
  }

  return occurrences.map((o) => {
    const match = existingByKey.get(`${o.groupId}|${o.scheduledStart.toISOString()}`);
    return match ? { ...o, sessionId: match.id, status: match.status } : o;
  });
}

/**
 * Idempotently materialize a Session for a (group, scheduledStart) tuple, then mark it IN_PROGRESS.
 * Optionally links the most recent APPROVED plan for this group + date if one exists.
 */
export async function startSession(opts: {
  coachId: string;
  groupId: string;
  scheduledStart: Date;
}) {
  const { coachId, groupId, scheduledStart } = opts;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { location: true },
  });
  if (!group) throw new SessionStartError("Group not found");
  if (group.primaryCoachId !== coachId) {
    throw new SessionStartError("Only the primary coach can start sessions for this group");
  }

  const schedule = group.schedule as unknown as WeeklySchedule | null;
  if (!schedule || !scheduledOccurrence(schedule, scheduledStart)) {
    throw new SessionStartError("This date/time is not on the group's recurring schedule");
  }

  const expected = scheduledOccurrence(schedule, scheduledStart);
  if (
    !expected ||
    expected.start.getTime() !== scheduledStart.getTime()
  ) {
    throw new SessionStartError("scheduledStart does not match the schedule's start time for that day");
  }

  // Find an APPROVED plan for this group on this date (window of the calendar day)
  const dayStart = new Date(scheduledStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(scheduledStart);
  dayEnd.setHours(23, 59, 59, 999);

  const plan = await prisma.sessionPlan.findFirst({
    where: {
      groupId,
      status: "APPROVED",
      isTemplate: false,
      sessionDate: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { reviewedAt: "desc" },
  });

  return prisma.$transaction(async (tx) => {
    let session = await tx.session.findFirst({
      where: { groupId, scheduledStart },
    });

    if (!session) {
      session = await tx.session.create({
        data: {
          groupId,
          locationId: group.locationId,
          coachId,
          internId: group.internId,
          planId: plan?.id ?? null,
          scheduledStart,
          scheduledEnd: expected.end,
          actualStart: new Date(),
          status: "IN_PROGRESS",
        },
      });
    } else if (session.status === "SCHEDULED") {
      session = await tx.session.update({
        where: { id: session.id },
        data: { actualStart: new Date(), status: "IN_PROGRESS" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: coachId,
        action: "session.start",
        entityType: "Session",
        entityId: session.id,
      },
    });

    return session;
  });
}

export async function endSession(opts: { coachId: string; sessionId: string }) {
  const { coachId, sessionId } = opts;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new SessionStartError("Session not found");
  if (session.coachId !== coachId) throw new SessionStartError("Not your session");

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { actualEnd: new Date(), status: "COMPLETED" },
  });
  await prisma.auditLog.create({
    data: { actorId: coachId, action: "session.end", entityType: "Session", entityId: sessionId },
  });
  return updated;
}

export async function getSessionForCoach(sessionId: string, coachId: string) {
  return prisma.session.findFirst({
    where: { id: sessionId, coachId },
    include: {
      group: {
        include: {
          location: true,
          discipline: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              trainee: {
                select: { id: true, fullNameEn: true, fullNameAr: true, profilePhotoUrl: true },
              },
            },
          },
        },
      },
      attendances: true,
      quickEvaluations: true,
      plan: true,
    },
  });
}
