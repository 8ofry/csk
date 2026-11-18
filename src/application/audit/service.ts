import { prisma } from "@/infrastructure/db/prisma";

export async function listAuditLogs(filters: {
  action?: string;
  actorId?: string;
  entityType?: string;
  take?: number;
} = {}) {
  return prisma.auditLog.findMany({
    where: {
      action: filters.action ? { contains: filters.action, mode: "insensitive" } : undefined,
      actorId: filters.actorId || undefined,
      entityType: filters.entityType || undefined,
    },
    include: {
      actor: { select: { id: true, fullNameEn: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.take ?? 150, 500),
  });
}
