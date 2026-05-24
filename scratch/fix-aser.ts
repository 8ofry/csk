import { prisma } from "../src/infrastructure/db/prisma";
import argon2 from "argon2";

const TARGET_GROUP_ID = "cmpk0s3xo0001eg003aehls2l"; // النادي الساعة 9
const SEED_PASSWORD = "Csk!2026";

async function main() {
  const group = await prisma.group.findUnique({
    where: { id: TARGET_GROUP_ID }
  });

  if (!group) {
    throw new Error("Target group not found!");
  }

  console.log("Fixing Aser Hazem creation and enrollment...");

  // Find if Aser already exists by name
  let aser = await prisma.user.findFirst({
    where: {
      OR: [
        { fullNameEn: "Aser Hazem" },
        { fullNameAr: "آسر حازم" }
      ]
    }
  });

  const passwordHash = await argon2.hash(SEED_PASSWORD);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (!aser) {
    // Create Aser with phone set to null to avoid unique constraint conflict with his brother Omar
    aser = await prisma.user.create({
      data: {
        role: "TRAINEE",
        email: "aser.hazem@csk.local",
        phone: null, // to avoid unique conflict
        passwordHash,
        fullNameAr: "آسر حازم",
        fullNameEn: "Aser Hazem",
        dob: new Date("2021-01-01"),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        preferredLocale: "AR"
      }
    });
    console.log(`  ✓ Created user Aser Hazem with email ${aser.email} (ID: ${aser.id})`);
  } else {
    console.log(`  ✓ Found existing user Aser Hazem (ID: ${aser.id})`);
  }

  // Check enrollment
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      traineeId: aser.id,
      groupId: TARGET_GROUP_ID,
      status: "ACTIVE"
    }
  });

  if (!existingEnrollment) {
    // Create Subscription
    const subId = `sub-auto-${aser.id.substring(0, 10)}-${group.id.substring(0, 10)}`;
    
    let subscription = await prisma.subscription.findUnique({
      where: { id: subId }
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          id: subId,
          traineeId: aser.id,
          groupId: group.id,
          locationId: group.locationId,
          disciplineId: group.disciplineId,
          monthlyFee: 1000,
          sessionsPerMonth: 12,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          paymentStatus: "DUE",
          active: true
        }
      });
      console.log(`  ✓ Created subscription`);
    }

    // Create Enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        traineeId: aser.id,
        groupId: group.id,
        subscriptionId: subscription.id,
        status: "ACTIVE"
      }
    });
    console.log(`  ✓ Enrolled in group ${group.name} (Enrollment ID: ${enrollment.id})`);
  } else {
    console.log(`  ✓ Already enrolled in group ${group.name}`);
  }

  console.log("Aser Hazem fix complete!");
}

main().catch(console.error);
