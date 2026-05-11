// Daily expiry-alert worker (FR-MED-03).
// Dispatches MEDICAL_DOC_EXPIRING notifications when a doc hits exactly 30 / 14 / 7
// days before expiry. Idempotent at the day-window level: re-runs the same day
// re-fire alerts (kept simple in v1; persistent dedup is a v2 follow-up).
//
// Wire to a daily cron: pg-boss schedule "daily-medical-alerts" calling runDailyAlerts().

import { prisma } from "@/infrastructure/db/prisma";
import { dispatchNotification } from "@/application/notifications/service";
import {
  ALERT_WINDOWS_DAYS,
  alertWindowFor,
  daysUntilExpiry,
} from "@/domain/medical/clearance";

export interface AlertReport {
  scanned: number;
  windowsHit: { docId: string; window: number; traineeId: string }[];
}

export async function runDailyAlerts(now: Date = new Date()): Promise<AlertReport> {
  // Fetch any document whose expiry is within the largest window
  const maxWindow = Math.max(...ALERT_WINDOWS_DAYS);
  const horizon = new Date(now.getTime() + (maxWindow + 1) * 24 * 60 * 60 * 1000);

  const docs = await prisma.medicalDocument.findMany({
    where: { status: "ACTIVE", expiryDate: { lte: horizon } },
    include: {
      trainee: {
        select: {
          id: true,
          fullNameEn: true,
          fullNameAr: true,
        },
      },
    },
  });

  const report: AlertReport = { scanned: docs.length, windowsHit: [] };

  for (const doc of docs) {
    const days = daysUntilExpiry(doc.expiryDate, now);
    const window = alertWindowFor(days);
    if (window == null) continue;

    report.windowsHit.push({ docId: doc.id, window, traineeId: doc.trainee.id });

    await dispatchNotification({
      recipientUserId: doc.trainee.id,
      eventType: "MEDICAL_DOC_EXPIRING",
      payload: {
        docType: doc.documentType,
        expiryDate: doc.expiryDate.toISOString().slice(0, 10),
        daysLeft: window,
      },
    });
  }

  return report;
}
