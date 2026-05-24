import { prisma } from "../src/infrastructure/db/prisma";

const TARGET_GROUP_ID = "cmpk0s3xo0001eg003aehls2l"; // النادي الساعة 9

async function main() {
  const group = await prisma.group.findUnique({
    where: { id: TARGET_GROUP_ID },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          trainee: true
        }
      }
    }
  });

  if (!group) {
    throw new Error("Group not found");
  }

  console.log(`Active enrollments in group: ${group.name} (Count: ${group.enrollments.length})`);
  group.enrollments.forEach((e, idx) => {
    console.log(`${idx + 1}. Name (En): ${e.trainee.fullNameEn} | Name (Ar): ${e.trainee.fullNameAr} | Phone: ${e.trainee.phone} | Email: ${e.trainee.email}`);
  });
}

main().catch(console.error);
