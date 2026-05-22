/**
 * reset-db.ts — Drops and recreates the "public" schema so that
 * `prisma migrate deploy` can run the init migration on a database
 * that has stale types/tables from previous db-push attempts.
 *
 * Usage:  tsx prisma/reset-db.ts
 * Reads DATABASE_URL from env (same as Prisma).
 */

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  console.log("→ Dropping public schema (CASCADE) …");
  await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE`);
  console.log("→ Recreating empty public schema …");
  await prisma.$executeRawUnsafe(`CREATE SCHEMA public`);
  console.log("→ Granting default privileges …");
  await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO PUBLIC`);
  await prisma.$disconnect();
  console.log("✔ Database schema reset complete.");
}

main().catch((e) => {
  console.error("Reset failed:", e);
  process.exit(1);
});
