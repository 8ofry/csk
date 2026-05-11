// Routing rules — pure logic, no I/O.
// Decides which channels a notification should actually go out on,
// given user opt-out preferences and event criticality (FR-NOT-04).

import { EVENT_CATALOG, type EventType, type NotificationChannel } from "./events";

export interface UserNotificationPrefs {
  /** Channels the user has explicitly opted OUT of. */
  optedOut: NotificationChannel[];
}

export function effectiveChannels(
  eventType: EventType,
  userPrefs: UserNotificationPrefs,
  /** Override which channels to consider; defaults to event catalog defaults. */
  candidate?: NotificationChannel[],
): NotificationChannel[] {
  const spec = EVENT_CATALOG[eventType];
  const initial = candidate ?? spec.defaultChannels;
  if (spec.critical) return initial;
  return initial.filter((c) => !userPrefs.optedOut.includes(c));
}
