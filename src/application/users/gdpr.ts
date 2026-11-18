import { prisma } from "@/infrastructure/db/prisma";

export async function exportUserPersonalData(userId: string) {
  const [
    user,
    enrollments,
    subscriptions,
    attendances,
    paymentsPaid,
    beltExamResults,
    championshipRegs,
    medicalRecord,
    notifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        email: true,
        phone: true,
        fullNameAr: true,
        fullNameEn: true,
        preferredLocale: true,
        dob: true,
        gender: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { traineeId: userId },
      include: { group: { select: { name: true } } },
    }),
    prisma.subscription.findMany({
      where: { traineeId: userId },
      include: { group: { select: { name: true } } },
    }),
    prisma.attendance.findMany({
      where: { traineeId: userId },
      orderBy: { markedAt: "desc" },
      take: 200,
    }),
    prisma.payment.findMany({
      where: { payerUserId: userId },
      orderBy: { paidAt: "desc" },
    }),
    prisma.beltExamResult.findMany({
      where: { traineeId: userId },
      include: { exam: { select: { examDate: true, federation: true } } },
    }),
    prisma.championshipRegistration.findMany({
      where: { traineeId: userId },
      include: { championship: { select: { name: true, startDate: true } } },
    }),
    prisma.medicalRecord.findUnique({
      where: { traineeId: userId },
    }),
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, eventType: true, channel: true, status: true, createdAt: true },
    }),
  ]);

  if (!user) throw new Error("User not found");

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "user.gdpr.export",
      entityType: "User",
      entityId: userId,
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    user,
    enrollments,
    subscriptions,
    attendances,
    paymentsPaid,
    beltExamResults,
    championshipRegs,
    medicalRecord,
    notifications,
  };
}
