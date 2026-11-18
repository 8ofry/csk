import { prisma } from "@/infrastructure/db/prisma";
import { renderTemplate, type EventPayload, type EventType } from "@/domain/notifications/events";
import {
  emailAdapter,
  whatsappAdapter,
  inAppAdapter,
  type ChannelAdapter,
} from "@/infrastructure/notifications/adapter";

const MAX_TOTAL_RETRIES = 5;

function adapterForChannel(channel: "WHATSAPP" | "EMAIL" | "IN_APP"): ChannelAdapter {
  switch (channel) {
    case "EMAIL":
      return emailAdapter();
    case "WHATSAPP":
      return whatsappAdapter();
    case "IN_APP":
      return inAppAdapter();
  }
}

export async function runNotificationRetries() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pending = await prisma.notification.findMany({
    where: {
      status: { in: ["QUEUED", "FAILED"] },
      retryCount: { lt: MAX_TOTAL_RETRIES },
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      recipient: {
        select: { email: true, phone: true, preferredLocale: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let succeeded = 0;
  let failed = 0;

  for (const row of pending) {
    const locale = row.recipient.preferredLocale === "AR" ? "ar" : "en";
    const rendered = renderTemplate(
      row.eventType as EventType,
      locale,
      (row.payload ?? {}) as EventPayload,
    );
    const adapter = adapterForChannel(row.channel);
    try {
      const res = await adapter.send({
        to: { email: row.recipient.email, phone: row.recipient.phone ?? undefined },
        subject: rendered.subject,
        body: rendered.body,
        notificationId: row.id,
      });
      if (!res.delivered) {
        throw new Error(res.error ?? "Delivery returned delivered=false");
      }
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: "SENT", sentAt: new Date(), errorMessage: null },
      });
      succeeded++;
    } catch (e) {
      await prisma.notification.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          retryCount: row.retryCount + 1,
          errorMessage: e instanceof Error ? e.message : String(e),
        },
      });
      failed++;
    }
  }

  return { scanned: pending.length, succeeded, failed };
}
