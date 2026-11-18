import { prisma } from "@/infrastructure/db/prisma";

export type TraineeBadge =
  | "FIRST_SESSION"
  | "STREAK_5"
  | "CONSISTENCY_12"
  | "MEDICALLY_CLEARED"
  | "CHAMPIONSHIP_FIGHTER";

export interface TraineeProgression {
  totalAttended: number;
  monthAttended: number;
  monthlyTarget: number;
  currentStreak: number;
  currentBelt: string | null;
  badges: TraineeBadge[];
}

export async function getTraineeProgression(traineeId: string): Promise<TraineeProgression> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [attendances, latestBelt, validMedical, champCount] = await Promise.all([
    prisma.attendance.findMany({
      where: { traineeId },
      orderBy: { markedAt: "desc" },
      select: { status: true, markedAt: true },
      take: 200,
    }),
    prisma.beltExamResult.findFirst({
      where: { traineeId, result: "PASSED" },
      orderBy: { recordedAt: "desc" },
      select: { newLevel: true },
    }),
    prisma.medicalDocument.findFirst({
      where: { traineeId, status: "ACTIVE", expiryDate: { gt: now } },
      select: { id: true },
    }),
    prisma.championshipRegistration.count({
      where: { traineeId, status: { in: ["COACH_CONFIRMED", "PAID"] } },
    }),
  ]);

  const attended = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE");
  const totalAttended = attended.length;
  const monthAttended = attended.filter((a) => a.markedAt >= thirtyDaysAgo).length;

  let currentStreak = 0;
  for (const a of attendances) {
    if (a.status === "PRESENT" || a.status === "LATE") currentStreak++;
    else if (a.status === "ABSENT") break;
  }

  const badges: TraineeBadge[] = [];
  if (totalAttended >= 1) badges.push("FIRST_SESSION");
  if (currentStreak >= 5) badges.push("STREAK_5");
  if (monthAttended >= 12) badges.push("CONSISTENCY_12");
  if (validMedical) badges.push("MEDICALLY_CLEARED");
  if (champCount > 0) badges.push("CHAMPIONSHIP_FIGHTER");

  return {
    totalAttended,
    monthAttended,
    monthlyTarget: 12,
    currentStreak,
    currentBelt: latestBelt?.newLevel ? `Level ${latestBelt.newLevel}` : null,
    badges,
  };
}
