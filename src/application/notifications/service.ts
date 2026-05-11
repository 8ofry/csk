// Notification dispatch service (FR-NOT-01..05).
//   - Renders templates per recipient locale
//   - Applies routing rules (event criticality + user opt-out)
//   - Persists Notification rows + records send/delivery status
//   - For each channel, calls the appropriate adapter
//   - Retries up to 3 times on failure (FR-NOT-05) — implemented as best-effort
//     in-process retry; for production this should be hardened via a queue
//     (pg-boss is wired in package.json for that).

import { prisma } from "@/infrastructure/db/prisma";
import { renderTemplate, type EventPayload, type EventType } from "@/domain/notifications/events";
import { effectiveChannels } from "@/domain/notifications/routing";
import {
  emailAdapter,
  inAppAdapter,
  whatsappAdapter,
  type ChannelAdapter,
} from "@/infrastructure/notifications/adapter";

const MAX_ATTEMPTS = 3;

interface DispatchInput {
  recipientUserId: string;
  eventType: EventType;
  payload: EventPayload;
  /** Override default channels (e.g. force EMAIL only). */
  channels?: ("WHATSAPP" | "EMAIL" | "IN_APP")[];
}

export async function dispatchNotification(input: DispatchInput) {
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientUserId },
    select: {
      id: true,
      email: true,
      phone: true,
      preferredLocale: true,
      notificationOptOuts: true,
      // For Parent-managed trainees, route to the parent (FR-AUTH-09)
      parentManaged: true,
      parent: {
        select: {
          id: true,
          email: true,
          phone: true,
          preferredLocale: true,
          notificationOptOuts: true,
        },
      },
    },
  });
  if (!recipient) return;

  const target = recipient.parentManaged && recipient.parent ? recipient.parent : recipient;
  const localeKey: "ar" | "en" = target.preferredLocale === "EN" ? "en" : "ar";
  const message = renderTemplate(input.eventType, localeKey, input.payload);

  // FR-NOT-04: honor per-user opt-outs (critical events bypass automatically inside effectiveChannels)
  const optedOut = (target.notificationOptOuts ?? []).filter((c): c is "WHATSAPP" | "EMAIL" | "IN_APP" =>
    c === "WHATSAPP" || c === "EMAIL" || c === "IN_APP",
  );
  const channels = effectiveChannels(input.eventType, { optedOut }, input.channels);

  for (const channel of channels) {
    const notif = await prisma.notification.create({
      data: {
        recipientId: target.id,
        eventType: input.eventType,
        channel,
        payload: { ...input.payload, _rendered: message } as object,
        status: "QUEUED",
      },
    });

    const adapter = pickAdapter(channel);
    const to = { email: target.email, phone: target.phone ?? undefined };

    let lastError: string | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await adapter.send({
          to,
          subject: message.subject,
          body: message.body,
          notificationId: notif.id,
        });
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            status: result.delivered ? "DELIVERED" : "SENT",
            sentAt: new Date(),
            deliveredAt: result.delivered ? new Date() : null,
            retryCount: attempt - 1,
            errorMessage: result.error ?? null,
          },
        });
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (lastError) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          status: "FAILED",
          retryCount: MAX_ATTEMPTS,
          errorMessage: lastError,
        },
      });
    }
  }
}

function pickAdapter(channel: "WHATSAPP" | "EMAIL" | "IN_APP"): ChannelAdapter {
  switch (channel) {
    case "EMAIL":
      return emailAdapter();
    case "WHATSAPP":
      return whatsappAdapter();
    case "IN_APP":
      return inAppAdapter();
  }
}
