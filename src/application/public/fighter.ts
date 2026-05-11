// Public fighter profile — sanitized data for the marketing site + v2 mobile.
// Returns ONLY the fields explicitly listed below; no PII (email, phone,
// national ID, address, dob, medical) ever leaves this function.

import { prisma } from "@/infrastructure/db/prisma";
import {
  aggregateFightRecord,
  type FightRow,
} from "@/domain/championships/fight-record";

export interface PublicFightDetail {
  championshipName: string;
  championshipDate: string; // ISO date (YYYY-MM-DD)
  isOfficial: boolean;
  opponentName: string;
  outcome: "WIN" | "LOSS" | "DRAW" | "NO_CONTEST";
  method: string | null;
  round: number | null;
  timeInRound: string | null;
  videoUrl: string | null;
  weightKg: number | null;
  level: string | null;
}

export interface PublicChampionshipEntry {
  id: string;
  name: string;
  startDate: string;
  status: string; // OPTED_IN | COACH_CONFIRMED | PAID | WITHDREW
  weightKg: number | null;
  level: string | null;
  fightCount: number;
}

export interface PublicBeltLevel {
  discipline: string;
  level: string;
  achievedAt: string;
}

export interface PublicFighterProfile {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  profilePhotoUrl: string | null;
  homeLocationName: string | null;
  record: ReturnType<typeof aggregateFightRecord>;
  fights: PublicFightDetail[];
  championships: PublicChampionshipEntry[];
  beltLevels: PublicBeltLevel[];
}

export async function getPublicFighterProfile(
  id: string,
): Promise<PublicFighterProfile | null> {
  const trainee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      status: true,
      fullNameEn: true,
      fullNameAr: true,
      profilePhotoUrl: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: { group: { select: { location: { select: { nameEn: true } } } } },
        take: 1,
      },
      championshipRegs: {
        select: {
          id: true,
          status: true,
          weightKg: true,
          level: true,
          championship: {
            select: {
              id: true,
              name: true,
              startDate: true,
              isOfficial: true,
            },
          },
          fightResults: {
            select: {
              opponentName: true,
              outcome: true,
              method: true,
              round: true,
              timeInRound: true,
              videoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      beltExamResults: {
        where: { result: "PASSED" },
        select: {
          newLevel: true,
          recordedAt: true,
          exam: { select: { discipline: { select: { nameEn: true } } } },
        },
        orderBy: { recordedAt: "desc" },
      },
    },
  });

  if (!trainee || trainee.role !== "TRAINEE" || trainee.status !== "ACTIVE") return null;

  // Flatten fights with championship context
  const fights: PublicFightDetail[] = [];
  for (const reg of trainee.championshipRegs) {
    for (const f of reg.fightResults) {
      fights.push({
        championshipName: reg.championship.name,
        championshipDate: reg.championship.startDate.toISOString().slice(0, 10),
        isOfficial: reg.championship.isOfficial,
        opponentName: f.opponentName,
        outcome: f.outcome,
        method: f.method,
        round: f.round,
        timeInRound: f.timeInRound,
        videoUrl: f.videoUrl,
        weightKg: reg.weightKg ? Number(reg.weightKg) : null,
        level: reg.level,
      });
    }
  }
  // Newest fights first
  fights.sort((a, b) => (a.championshipDate < b.championshipDate ? 1 : -1));

  const record = aggregateFightRecord(
    fights.map((f): FightRow => ({ outcome: f.outcome, method: f.method as FightRow["method"] })),
  );

  const championships: PublicChampionshipEntry[] = trainee.championshipRegs.map((reg) => ({
    id: reg.championship.id,
    name: reg.championship.name,
    startDate: reg.championship.startDate.toISOString().slice(0, 10),
    status: reg.status,
    weightKg: reg.weightKg ? Number(reg.weightKg) : null,
    level: reg.level,
    fightCount: reg.fightResults.length,
  }));

  // Pick the most recent passed level per discipline
  const seenDisc = new Set<string>();
  const beltLevels: PublicBeltLevel[] = [];
  for (const r of trainee.beltExamResults) {
    const d = r.exam.discipline.nameEn;
    if (seenDisc.has(d)) continue;
    if (!r.newLevel) continue;
    seenDisc.add(d);
    beltLevels.push({
      discipline: d,
      level: r.newLevel,
      achievedAt: r.recordedAt.toISOString().slice(0, 10),
    });
  }

  return {
    id: trainee.id,
    fullNameEn: trainee.fullNameEn,
    fullNameAr: trainee.fullNameAr,
    profilePhotoUrl: trainee.profilePhotoUrl,
    homeLocationName: trainee.enrollments[0]?.group.location.nameEn ?? null,
    record,
    fights,
    championships,
    beltLevels,
  };
}
