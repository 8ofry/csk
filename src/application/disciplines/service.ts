// Disciplines service (FR-LOC-03 — disciplines defined globally, assigned to locations).
// Skill taxonomy is discipline-aware (FR-EVAL-04).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

export const disciplineCategorySchema = z.enum([
  "BOXING",
  "KICKBOXING",
  "MMA",
  "KARATE",
  "FITNESS",
  "OTHER",
]);

// Skills arrive as a comma- or newline-separated string from the form;
// service splits them into a string[] before persisting.
export const disciplineInputSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  category: disciplineCategorySchema,
  skills: z.string().min(1),
  active: z.boolean().default(true),
});

export type DisciplineInput = z.infer<typeof disciplineInputSchema>;

function splitSkills(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listDisciplines() {
  return prisma.discipline.findMany({
    orderBy: [{ active: "desc" }, { nameEn: "asc" }],
    include: { _count: { select: { groups: true } } },
  });
}

export async function getDiscipline(id: string) {
  return prisma.discipline.findUnique({ where: { id } });
}

export async function createDiscipline(input: DisciplineInput, actorId: string) {
  const data = disciplineInputSchema.parse(input);
  const skills = splitSkills(data.skills);
  const created = await prisma.discipline.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      category: data.category,
      skillsTaxonomy: { skills },
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "discipline.create",
      entityType: "Discipline",
      entityId: created.id,
      changes: { ...data },
    },
  });
  return created;
}

export async function updateDiscipline(id: string, input: DisciplineInput, actorId: string) {
  const data = disciplineInputSchema.parse(input);
  const skills = splitSkills(data.skills);
  const updated = await prisma.discipline.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      category: data.category,
      skillsTaxonomy: { skills },
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "discipline.update",
      entityType: "Discipline",
      entityId: id,
      changes: { ...data },
    },
  });
  return updated;
}
