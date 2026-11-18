// Long-running background worker. Self-hosted deployments run this alongside
// the Next.js server: `npm run worker`.
//
// In serverless deployments (Vercel etc.) you don't run this — instead point an
// external scheduler at POST /api/v1/admin/jobs/* with CRON_SECRET.

import PgBoss from "pg-boss";
import { runDailyAlerts } from "../src/application/medical/expiry-alerts";
import { runPaymentReminders } from "../src/application/payments/reminders";
import { runMonthlyReportBatch } from "../src/application/monthly-reports/service";
import { runNotificationRetries } from "../src/application/notifications/retry-job";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required to start the worker.");
  process.exit(1);
}

const boss = new PgBoss(DATABASE_URL);

const JOBS = {
  DAILY_MEDICAL_ALERTS: "daily-medical-alerts",
  DAILY_PAYMENT_REMINDERS: "daily-payment-reminders",
  MONTHLY_REPORT_BATCH: "monthly-report-batch",
  NOTIFICATION_RETRIES: "notification-retries",
} as const;

async function main() {
  await boss.start();
  console.info("[worker] pg-boss started");

  await boss.schedule(JOBS.DAILY_MEDICAL_ALERTS, "0 9 * * *", undefined, { tz: "Africa/Cairo" });
  await boss.schedule(JOBS.DAILY_PAYMENT_REMINDERS, "0 10 * * *", undefined, { tz: "Africa/Cairo" });
  await boss.schedule(JOBS.MONTHLY_REPORT_BATCH, "0 6 1 * *", undefined, { tz: "Africa/Cairo" });
  await boss.schedule(JOBS.NOTIFICATION_RETRIES, "*/15 * * * *", undefined, { tz: "Africa/Cairo" });

  await boss.work(JOBS.DAILY_MEDICAL_ALERTS, async () => {
    const report = await runDailyAlerts();
    console.info(`[worker] medical alerts: scanned=${report.scanned}, hit=${report.windowsHit.length}`);
  });

  await boss.work(JOBS.DAILY_PAYMENT_REMINDERS, async () => {
    const report = await runPaymentReminders();
    console.info(
      `[worker] payment reminders: scanned=${report.scanned}, reminded=${report.reminded}, overdue=${report.overdue}`,
    );
  });

  await boss.work(JOBS.MONTHLY_REPORT_BATCH, async () => {
    const report = await runMonthlyReportBatch();
    console.info(
      `[worker] monthly reports (${report.year}-${report.month}): scanned=${report.scanned}, generated=${report.generated}, errors=${report.errors}`,
    );
  });

  await boss.work(JOBS.NOTIFICATION_RETRIES, async () => {
    const report = await runNotificationRetries();
    console.info(
      `[worker] notification retries: scanned=${report.scanned}, succeeded=${report.succeeded}, failed=${report.failed}`,
    );
  });

  console.info("[worker] all 4 scheduled jobs registered");

  process.on("SIGTERM", async () => {
    console.info("[worker] SIGTERM, stopping…");
    await boss.stop();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error("[worker] failed to start", e);
  process.exit(1);
});
