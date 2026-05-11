// GET /api/v1/me/schedule
// Trainee's upcoming sessions: derived from active enrollments + group schedules.

import { prisma } from "@/infrastructure/db/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";
import { iterateOccurrences, type WeeklySchedule } from "@/domain/sessions/schedule";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const weeks = Math.min(8, Math.max(1, Number(url.searchParams.get("weeks") ?? 2)));

  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: auth.user.id, status: "ACTIVE" },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          schedule: true,
          location: { select: { id: true, nameEn: true } },
          discipline: { select: { id: true, nameEn: true } },
          primaryCoach: { select: { id: true, fullNameEn: true } },
        },
      },
    },
  });

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + weeks * 7);

  const sessions: {
    groupId: string;
    groupName: string;
    location: { id: string; nameEn: string };
    discipline: { id: string; nameEn: string };
    coach: { id: string | null; fullNameEn: string | null };
    scheduledStart: Date;
    scheduledEnd: Date;
  }[] = [];

  for (const enr of enrollments) {
    const sched = enr.group.schedule as unknown as WeeklySchedule | null;
    if (!sched?.days?.length) continue;
    for (const occ of iterateOccurrences(sched, now, end)) {
      sessions.push({
        groupId: enr.group.id,
        groupName: enr.group.name,
        location: enr.group.location,
        discipline: enr.group.discipline,
        coach: {
          id: enr.group.primaryCoach?.id ?? null,
          fullNameEn: enr.group.primaryCoach?.fullNameEn ?? null,
        },
        scheduledStart: occ.start,
        scheduledEnd: occ.end,
      });
    }
  }

  sessions.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
  return jsonResponse({ sessions });
}
