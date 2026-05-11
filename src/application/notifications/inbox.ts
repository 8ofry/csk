// Notifications inbox + per-user preferences (FR-NOT-04).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

const channelEnum = z.enum(["WHATSAPP", "EMAIL", "IN_APP"]);

export const preferencesSchema = z.object({
  optedOut: z.array(channelEnum).default([]),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

/** In-app inbox — IN_APP channel only, newest first. */
export async function listInbox(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { recipientId: userId, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Count of notifications newer than the user's last "mark all read" timestamp. */
export async function unreadCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsReadAt: true },
  });
  return prisma.notification.count({
    where: {
      recipientId: userId,
      channel: "IN_APP",
      createdAt: user?.notificationsReadAt
        ? { gt: user.notificationsReadAt }
        : undefined,
    },
  });
}

export async function markAllRead(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { notificationsReadAt: new Date() },
  });
}

export async function getPreferences(userId: string): Promise<PreferencesInput> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationOptOuts: true },
  });
  return preferencesSchema.parse({ optedOut: user?.notificationOptOuts ?? [] });
}

export async function setPreferences(userId: string, input: PreferencesInput) {
  const data = preferencesSchema.parse(input);
  await prisma.user.update({
    where: { id: userId },
    data: { notificationOptOuts: data.optedOut },
  });
}
