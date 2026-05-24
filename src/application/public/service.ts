// Public-website data service. Exposes only sanitized fields (FR-WEB-01..05).
// No PII for non-customers, no financials, no medical, no internal IDs in URLs.

import { prisma } from "@/infrastructure/db/prisma";
import { aggregateFightRecord, type FightRow } from "@/domain/championships/fight-record";

export async function listPublicLocations() {
  return prisma.location.findMany({
    where: { active: true },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      district: true,
      address: true,
      latitude: true,
      longitude: true,
      ownership: true,
      openingHours: true,
      contactPhone: true,
    },
  });
}

export async function listPublicDisciplines() {
  return prisma.discipline.findMany({
    where: { active: true },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      category: true,
      _count: { select: { groups: { where: { active: true } } } },
    },
  });
}

export async function listPublicCoaches() {
  const coaches = await prisma.user.findMany({
    where: { role: "COACH", status: "ACTIVE" },
    orderBy: { fullNameEn: "asc" },
    select: {
      id: true,
      fullNameEn: true,
      fullNameAr: true,
      profilePhotoUrl: true,
      groupCoachAssignments: {
        where: { group: { active: true } },
        select: {
          group: {
            select: {
              location: { select: { nameEn: true } },
              discipline: { select: { nameEn: true, category: true } },
            },
          },
        },
      },
    },
  });

  return coaches.map((c) => {
    const groups = c.groupCoachAssignments.map((a) => a.group);
    return {
      id: c.id,
      fullNameEn: c.fullNameEn,
      fullNameAr: c.fullNameAr,
      profilePhotoUrl: c.profilePhotoUrl,
      locations: [...new Set(groups.map((g) => g.location.nameEn))],
      disciplines: [...new Set(groups.map((g) => g.discipline.nameEn))],
      categories: [...new Set(groups.map((g) => g.discipline.category))],
    };
  });
}

export async function publicScheduleByLocation() {
  const locations = await prisma.location.findMany({
    where: { active: true },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      nameEn: true,
      district: true,
      groups: {
        where: { active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          schedule: true,
          discipline: { select: { nameEn: true, category: true } },
          coaches: {
            select: {
              coach: { select: { fullNameEn: true } },
            },
          },
        },
      },
    },
  });
  return locations.filter((l) => l.groups.length > 0);
}

export interface ChampionPublicProfile {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  profilePhotoUrl: string | null;
  record: ReturnType<typeof aggregateFightRecord>;
}

/** Trainees with at least one recorded fight, sorted by wins desc. */
export async function listPublicChampions(limit = 24): Promise<ChampionPublicProfile[]> {
  // Fetch fighters who have any fight result, then aggregate per fighter.
  const fighters = await prisma.user.findMany({
    where: {
      role: "TRAINEE",
      championshipRegs: { some: { fightResults: { some: {} } } },
    },
    select: {
      id: true,
      fullNameEn: true,
      fullNameAr: true,
      profilePhotoUrl: true,
      championshipRegs: {
        select: {
          fightResults: { select: { outcome: true, method: true } },
        },
      },
    },
    take: limit,
  });

  return fighters
    .map((f) => {
      const fights: FightRow[] = f.championshipRegs.flatMap((r) =>
        r.fightResults.map((res) => ({ outcome: res.outcome, method: res.method })),
      );
      const record = aggregateFightRecord(fights);
      return {
        id: f.id,
        fullNameEn: f.fullNameEn,
        fullNameAr: f.fullNameAr,
        profilePhotoUrl: f.profilePhotoUrl,
        record,
      };
    })
    .sort((a, b) => b.record.wins - a.record.wins);
}

/** Pricing/Plans data — pending §14.2 confirmation. Surfaces what's known publicly. */
export async function publicPricing() {
  return {
    pendingConfirmation: true,
    note: "Contact your nearest CSK location for current monthly subscription rates.",
    defaults: {
      sessionsPerMonth: 12,
      privateSessionAvailable: true,
    },
    disciplines: await listPublicDisciplines(),
  };
}
