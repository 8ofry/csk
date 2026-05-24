import { prisma } from "../src/infrastructure/db/prisma";

async function main() {
  const today = new Date("2026-05-24");
  const tomorrow = new Date("2026-05-25");

  console.log("Searching for sessions scheduled today (2026-05-24)...");
  const sessions = await prisma.session.findMany({
    where: {
      scheduledStart: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      group: {
        include: {
          discipline: true,
          location: true,
          enrollments: {
            include: {
              trainee: true
            }
          }
        },
      },
    },
  });

  console.log(`Found ${sessions.length} sessions for today:`);
  for (const s of sessions) {
    console.log(`- Session ID: ${s.id}`);
    console.log(`  Group Name: ${s.group.name} (ID: ${s.groupId})`);
    console.log(`  Location: ${s.group.location.nameEn}`);
    console.log(`  Discipline: ${s.group.discipline.nameEn}`);
    console.log(`  Start Time: ${s.scheduledStart}`);
    console.log(`  Enrolled Trainees count: ${s.group.enrollments.length}`);
  }

  console.log("\nSearching for all active groups in the system...");
  const activeGroups = await prisma.group.findMany({
    where: { active: true },
    include: {
      discipline: true,
      location: true,
    }
  });
  console.log(`Found ${activeGroups.length} active groups:`);
  for (const g of activeGroups) {
    console.log(`- Group ID: ${g.id}`);
    console.log(`  Name: ${g.name}`);
    console.log(`  Location: ${g.location.nameEn}`);
    console.log(`  Discipline: ${g.discipline.nameEn}`);
    console.log(`  Schedule: ${JSON.stringify(g.schedule)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
