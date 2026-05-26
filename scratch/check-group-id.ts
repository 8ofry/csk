import { prisma } from "../src/infrastructure/db/prisma";

async function main() {
  const targetId = "cmplzzcce0001b82aduql3nfn";

  console.log(`Checking database for ID: ${targetId}...`);

  const group = await prisma.group.findUnique({
    where: { id: targetId },
    include: {
      location: true,
      discipline: true,
      enrollments: {
        include: { trainee: true }
      }
    }
  });

  if (group) {
    console.log("FOUND GROUP:");
    console.log(`- Name: ${group.name}`);
    console.log(`- Location: ${group.location.nameEn}`);
    console.log(`- Discipline: ${group.discipline.nameEn}`);
    console.log(`- Active: ${group.active}`);
    console.log(`- Enrollments count: ${group.enrollments.length}`);
    for (const e of group.enrollments) {
      console.log(`  * ${e.trainee.fullNameEn} (${e.trainee.fullNameAr}) - ${e.status}`);
    }
    return;
  }

  const session = await prisma.session.findUnique({
    where: { id: targetId }
  });

  if (session) {
    console.log("FOUND SESSION:");
    console.log(`- Scheduled Start: ${session.scheduledStart}`);
    console.log(`- Status: ${session.status}`);
    return;
  }

  const location = await prisma.location.findUnique({
    where: { id: targetId }
  });

  if (location) {
    console.log("FOUND LOCATION:");
    console.log(`- Name: ${location.nameEn}`);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId }
  });

  if (user) {
    console.log("FOUND USER:");
    console.log(`- Name: ${user.fullNameEn} (${user.fullNameAr})`);
    console.log(`- Role: ${user.role}`);
    return;
  }

  console.log("ID NOT FOUND in Group, Session, Location, or User tables.");
}

main().catch(console.error);
