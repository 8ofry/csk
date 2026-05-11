// Lightweight user-directory queries used by group/contract pickers.
import { prisma } from "@/infrastructure/db/prisma";

function toOption(u: {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
}) {
  return { id: u.id, label: `${u.fullNameEn} (${u.fullNameAr})` };
}

export async function listActiveCoaches() {
  const rows = await prisma.user.findMany({
    where: { role: "COACH", status: "ACTIVE" },
    select: { id: true, fullNameEn: true, fullNameAr: true },
    orderBy: { fullNameEn: "asc" },
  });
  return rows.map(toOption);
}

export async function listActiveInterns() {
  const rows = await prisma.user.findMany({
    where: { role: "INTERN", status: "ACTIVE" },
    select: { id: true, fullNameEn: true, fullNameAr: true },
    orderBy: { fullNameEn: "asc" },
  });
  return rows.map(toOption);
}

export async function listActiveTrainees() {
  const rows = await prisma.user.findMany({
    where: { role: "TRAINEE", status: "ACTIVE" },
    select: { id: true, fullNameEn: true, fullNameAr: true },
    orderBy: { fullNameEn: "asc" },
  });
  return rows.map(toOption);
}
