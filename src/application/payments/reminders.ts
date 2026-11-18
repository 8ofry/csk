import { prisma } from "@/infrastructure/db/prisma";
import { dispatchNotification } from "@/application/notifications/service";

const REMINDER_LOOKBACK_DAYS = 7;

export async function runPaymentReminders() {
  const now = new Date();
  const upcomingCutoff = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const dedupeSince = new Date(now.getTime() - REMINDER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      paymentStatus: { in: ["DUE", "PARTIAL", "OVERDUE"] },
      currentPeriodEnd: { lte: upcomingCutoff },
      trainee: { status: "ACTIVE" },
    },
    include: {
      trainee: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      group: { select: { name: true } },
    },
  });

  let reminded = 0;
  let overdue = 0;

  for (const sub of subscriptions) {
    const isOverdue = sub.paymentStatus === "OVERDUE" || sub.currentPeriodEnd < now;
    const eventType = isOverdue ? "PAYMENT_OVERDUE" : "PAYMENT_REMINDER";

    const recent = await prisma.notification.findFirst({
      where: {
        recipientId: sub.traineeId,
        eventType,
        createdAt: { gte: dedupeSince },
      },
      select: { id: true },
    });
    if (recent) continue;

    await dispatchNotification({
      recipientUserId: sub.traineeId,
      eventType,
      payload: {
        traineeName: sub.trainee.fullNameEn,
        groupName: sub.group.name,
        dueDate: sub.currentPeriodEnd.toISOString().slice(0, 10),
        amount: sub.monthlyFee.toNumber(),
      },
    });

    if (isOverdue) overdue++;
    else reminded++;
  }

  return { scanned: subscriptions.length, reminded, overdue };
}
