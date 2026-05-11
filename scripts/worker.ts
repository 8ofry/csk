// Long-running background worker. Self-hosted deployments run this alongside
// the Next.js server: `npm run worker`.
//
// In serverless deployments (Vercel etc.) you don't run this — instead point an
// external scheduler at POST /api/v1/admin/jobs/medical-alerts with CRON_SECRET.

import PgBoss from "pg-boss";
import { runDailyAlerts } from "../src/application/medical/expiry-alerts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required to start the worker.");
  process.exit(1);
}

const boss = new PgBoss(DATABASE_URL);

// Job names are stable so re-runs keep the same schedule entry.
const DAILY_ALERTS = "daily-medical-alerts";

async function main() {
  await boss.start();
  console.info("[worker] pg-boss started");

  // Daily at 09:00 Africa/Cairo
  await boss.schedule(DAILY_ALERTS, "0 9 * * *", undefined, { tz: "Africa/Cairo" });

  await boss.work(DAILY_ALERTS, async () => {
    const report = await runDailyAlerts();
    console.info(
      `[worker] daily medical alerts: scanned ${report.scanned}, fired ${report.windowsHit.length}`,
    );
  });

  console.info(`[worker] subscribed to ${DAILY_ALERTS}; daily 09:00 Africa/Cairo`);

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
