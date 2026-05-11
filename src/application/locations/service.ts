// Application service for Locations (FR-LOC-01..03).
// Pure orchestration: validates input, talks to Prisma, writes audit log.

import { prisma } from "@/infrastructure/db/prisma";
import type { LocationInput } from "./schemas";
import { locationInputSchema } from "./schemas";
import { defaultSplitRules } from "@/domain/financial/default-rules";

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: [{ active: "desc" }, { nameEn: "asc" }],
    include: {
      _count: { select: { groups: true, sessions: true } },
    },
  });
}

export async function getLocation(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      splitRules: { orderBy: { revenueType: "asc" } },
      _count: { select: { groups: true, sessions: true } },
    },
  });
}

export async function createLocation(input: LocationInput, actorId: string) {
  const data = locationInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const location = await tx.location.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        district: data.district,
        address: data.address,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        ownership: data.ownership,
        contactPerson: data.contactPerson ?? null,
        contactPhone: data.contactPhone ?? null,
        openingHours: data.openingHours ?? undefined,
        active: data.active,
      },
    });

    // Seed default split rules for the new location based on ownership (FR-LOC-02 + §10.1)
    const isFightClub = data.ownership === "CSK_OWNED";
    for (const stream of [
      "SUBSCRIPTION",
      "PRIVATE_SESSION",
      "BELT_EXAM",
      "CHAMPIONSHIP",
      "MERCHANDISE",
    ] as const) {
      const ruleSet = isFightClub
        ? defaultSplitRules[stream].fightClub
        : defaultSplitRules[stream].partnerVenue;

      const venuePct = ruleSet.find((r) => r.recipientType === "VENUE")?.percent ?? 0;
      const cskPct = ruleSet.find((r) => r.recipientType === "CSK")?.percent ?? 0;
      const coachPct = ruleSet.find((r) => r.recipientType === "COACH")?.percent ?? 0;
      const otherRule = ruleSet.find(
        (r) =>
          r.recipientType === "FEDERATION" ||
          r.recipientType === "TAX_ADMIN" ||
          r.recipientType === "DISCIPLINE_OWNER",
      );

      await tx.locationSplitRule.create({
        data: {
          locationId: location.id,
          revenueType: stream,
          venuePercent: venuePct,
          cskPercent: cskPct,
          coachPercent: coachPct,
          otherPercent: otherRule?.percent ?? 0,
          otherLabel: otherRule?.label ?? null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "location.create",
        entityType: "Location",
        entityId: location.id,
        changes: { ...data },
      },
    });

    return location;
  });
}

export async function updateLocation(id: string, input: LocationInput, actorId: string) {
  const data = locationInputSchema.parse(input);

  const before = await prisma.location.findUnique({ where: { id } });
  if (!before) throw new Error("Location not found");

  const updated = await prisma.location.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      district: data.district,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      ownership: data.ownership,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      openingHours: data.openingHours ?? undefined,
      active: data.active,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "location.update",
      entityType: "Location",
      entityId: id,
      changes: { before, after: updated },
    },
  });

  return updated;
}

export async function archiveLocation(id: string, actorId: string) {
  const updated = await prisma.location.update({
    where: { id },
    data: { active: false },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "location.archive",
      entityType: "Location",
      entityId: id,
    },
  });
  return updated;
}
