// CSK seed data — boots the system with the 5 locations from SRS §5,
// the 5 disciplines, default split rules per §10.1, and a few sample accounts
// (Captain Saied admin + 1 head coach + 1 coach + 1 trainee) for local dev.
//
// Run: npm run db:seed

import { PrismaClient, Ownership, DisciplineCategory } from "@prisma/client";
import argon2 from "argon2";
import { defaultSplitRules } from "../src/domain/financial/default-rules";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Csk!2026";

async function hash(pw: string) {
  return argon2.hash(pw);
}

async function main() {
  console.log("→ Seeding disciplines…");
  const disciplines = [
    { nameEn: "Boxing", nameAr: "الملاكمة", category: "BOXING" as DisciplineCategory, skills: ["jab", "cross", "hooks", "uppercuts", "footwork", "head_movement", "defense", "conditioning", "sparring"] },
    { nameEn: "Kickboxing", nameAr: "الكيك بوكسينغ", category: "KICKBOXING" as DisciplineCategory, skills: ["jab", "cross", "hooks", "uppercuts", "front_kick", "roundhouse", "side_kick", "knee_strikes", "footwork", "defense", "sparring"] },
    { nameEn: "MMA", nameAr: "الفنون القتالية المختلطة", category: "MMA" as DisciplineCategory, skills: ["striking", "takedowns", "ground_control", "submissions", "ground_and_pound", "sparring"] },
    { nameEn: "Karate", nameAr: "الكاراتيه", category: "KARATE" as DisciplineCategory, skills: ["kata", "kihon", "kumite"] },
    { nameEn: "Fitness", nameAr: "اللياقة البدنية", category: "FITNESS" as DisciplineCategory, skills: ["cardio", "strength", "flexibility", "endurance", "agility"] },
  ];
  const disciplineRows = await Promise.all(
    disciplines.map((d) =>
      prisma.discipline.upsert({
        where: { id: `seed-disc-${d.category.toLowerCase()}` },
        create: {
          id: `seed-disc-${d.category.toLowerCase()}`,
          nameAr: d.nameAr,
          nameEn: d.nameEn,
          category: d.category,
          skillsTaxonomy: { skills: d.skills },
        },
        update: { skillsTaxonomy: { skills: d.skills } },
      }),
    ),
  );
  console.log(`  ✓ ${disciplineRows.length} disciplines`);

  console.log("→ Seeding locations (SRS §5)…");
  const locations = [
    {
      id: "seed-loc-fight-club",
      nameEn: "Fight Club",
      nameAr: "فايت كلوب",
      district: "El Vellal District",
      address: "El Vellal District, Benha, Egypt",
      ownership: "CSK_OWNED" as Ownership,
    },
    {
      id: "seed-loc-benha-sports-club",
      nameEn: "Benha Sports Club",
      nameAr: "نادي بنها الرياضي",
      district: "Center of Benha",
      address: "Center of Benha, Egypt",
      ownership: "PARTNER" as Ownership,
    },
    {
      id: "seed-loc-monster-gym",
      nameEn: "Monster GYM",
      nameAr: "مونستر جيم",
      district: "Batta Town",
      address: "Batta Town, Benha, Egypt",
      ownership: "PARTNER" as Ownership,
    },
    {
      id: "seed-loc-addfit-gym",
      nameEn: "AddFit GYM",
      nameAr: "آدفت جيم",
      district: "El Vellal District",
      address: "El Vellal District, Benha, Egypt",
      ownership: "PARTNER" as Ownership,
    },
    {
      id: "seed-loc-faculty-sports",
      nameEn: "Faculty of Sports Science",
      nameAr: "كلية علوم الرياضة",
      district: "Benha University",
      address: "Benha University, Egypt",
      ownership: "PATRONAGE" as Ownership,
    },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      create: {
        id: loc.id,
        nameAr: loc.nameAr,
        nameEn: loc.nameEn,
        district: loc.district,
        address: loc.address,
        ownership: loc.ownership,
        active: true,
      },
      update: {},
    });

    // Default split rules for each revenue stream
    for (const stream of [
      "SUBSCRIPTION",
      "PRIVATE_SESSION",
      "BELT_EXAM",
      "CHAMPIONSHIP",
      "MERCHANDISE",
    ] as const) {
      const ruleSet =
        loc.ownership === "CSK_OWNED"
          ? defaultSplitRules[stream].fightClub
          : defaultSplitRules[stream].partnerVenue;

      const venuePct = ruleSet.find((r) => r.recipientType === "VENUE")?.percent ?? 0;
      const cskPct = ruleSet.find((r) => r.recipientType === "CSK")?.percent ?? 0;
      const coachPct = ruleSet.find((r) => r.recipientType === "COACH")?.percent ?? 0;
      const otherRule = ruleSet.find(
        (r) =>
          r.recipientType === "FEDERATION" ||
          r.recipientType === "TAX_ADMIN" ||
          r.recipientType === "DISCIPLINE_OWNER",
      );

      const ruleId = `seed-split-${loc.id}-${stream}`;
      await prisma.locationSplitRule.upsert({
        where: { id: ruleId },
        create: {
          id: ruleId,
          locationId: loc.id,
          revenueType: stream,
          venuePercent: venuePct,
          cskPercent: cskPct,
          coachPercent: coachPct,
          otherPercent: otherRule?.percent ?? 0,
          otherLabel: otherRule?.label ?? null,
        },
        update: {},
      });
    }
  }
  console.log(`  ✓ ${locations.length} locations + default split rules`);

  console.log("→ Seeding sample users…");
  const adminId = "seed-user-admin";
  const headCoachId = "seed-user-head-coach";
  const coachId = "seed-user-coach";
  const traineeId = "seed-user-trainee";

  await prisma.user.upsert({
    where: { id: adminId },
    create: {
      id: adminId,
      role: "ADMIN",
      email: "captain@csk.local",
      phone: "+201000000001",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "كابتن سعيد",
      fullNameEn: "Captain Saied",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: headCoachId },
    create: {
      id: headCoachId,
      role: "HEAD_COACH",
      email: "head.coach@csk.local",
      phone: "+201000000002",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "المدرب الرئيسي",
      fullNameEn: "Head Coach Sample",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: coachId },
    create: {
      id: coachId,
      role: "COACH",
      email: "coach@csk.local",
      phone: "+201000000003",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "كوتش محمد",
      fullNameEn: "Coach Mohamed",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { id: traineeId },
    create: {
      id: traineeId,
      role: "TRAINEE",
      email: "trainee@csk.local",
      phone: "+201000000004",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "متدرب أحمد",
      fullNameEn: "Trainee Ahmed",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  console.log("  ✓ 4 baseline users (password: " + SEED_PASSWORD + ")");

  await seedDemoData({
    coachMohamedId: coachId,
    headCoachId,
    traineeAhmedId: traineeId,
  });

  console.log("\nSeed complete.");
  console.log("Login at /en/login or /ar/login with:");
  console.log("  captain@csk.local      → ADMIN");
  console.log("  head.coach@csk.local   → HEAD_COACH");
  console.log("  coach@csk.local        → COACH");
  console.log("  trainee@csk.local      → TRAINEE");
}

// ─────────────────────────────────────────────────────────────────
// DEMO DATA — extra coaches/trainees, groups, training units, an approved
// session plan + recorded session, championship, belt exam, merchandise.
// All upserts use stable `seed-` IDs so re-running the seed is idempotent.
// ─────────────────────────────────────────────────────────────────

interface SeedRefs {
  coachMohamedId: string;
  headCoachId: string;
  traineeAhmedId: string;
}

async function seedDemoData(refs: SeedRefs) {
  console.log("→ Seeding demo coaches + trainees…");

  const extraUsers = [
    { id: "seed-user-coach-tarek", role: "COACH" as const, email: "tarek@csk.local", phone: "+201000000010", nameEn: "Coach Tarek", nameAr: "كوتش طارق" },
    { id: "seed-user-coach-ali", role: "COACH" as const, email: "ali@csk.local", phone: "+201000000011", nameEn: "Coach Ali", nameAr: "كوتش علي" },
    { id: "seed-user-coach-karim", role: "COACH" as const, email: "karim@csk.local", phone: "+201000000012", nameEn: "Coach Karim", nameAr: "كوتش كريم" },
    { id: "seed-user-intern-omar", role: "INTERN" as const, email: "omar@csk.local", phone: "+201000000020", nameEn: "Intern Omar", nameAr: "عمر متدرب مدرب" },
    { id: "seed-user-trainee-khaled", role: "TRAINEE" as const, email: "khaled@csk.local", phone: "+201000000030", nameEn: "Trainee Khaled", nameAr: "خالد متدرب" },
    { id: "seed-user-trainee-yara", role: "TRAINEE" as const, email: "yara@csk.local", phone: "+201000000031", nameEn: "Trainee Yara", nameAr: "يارا متدربة" },
    { id: "seed-user-trainee-sara", role: "TRAINEE" as const, email: "sara@csk.local", phone: "+201000000032", nameEn: "Trainee Sara", nameAr: "سارة متدربة" },
    { id: "seed-user-trainee-hassan", role: "TRAINEE" as const, email: "hassan@csk.local", phone: "+201000000033", nameEn: "Trainee Hassan", nameAr: "حسن متدرب" },
    { id: "seed-user-trainee-layla", role: "TRAINEE" as const, email: "layla@csk.local", phone: "+201000000034", nameEn: "Trainee Layla", nameAr: "ليلى متدربة" },
  ];
  for (const u of extraUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        role: u.role,
        email: u.email,
        phone: u.phone,
        passwordHash: await hash(SEED_PASSWORD),
        fullNameAr: u.nameAr,
        fullNameEn: u.nameEn,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        preferredLocale: "AR",
      },
      update: {},
    });
  }
  console.log(`  ✓ ${extraUsers.length} extra users`);

  console.log("→ Seeding groups + enrollments…");
  const fightClubId = "seed-loc-fight-club";
  const monsterId = "seed-loc-monster-gym";
  const facultyId = "seed-loc-faculty-sports";
  const addfitId = "seed-loc-addfit-gym";

  const boxingId = "seed-disc-boxing";
  const kickboxingId = "seed-disc-kickboxing";
  const mmaId = "seed-disc-mma";
  const karateId = "seed-disc-karate";
  const fitnessId = "seed-disc-fitness";

  const groups = [
    {
      id: "seed-group-boxing-fc-evening",
      name: "Boxing — Beginners (Mon/Wed evening)",
      locationId: fightClubId,
      disciplineId: boxingId,
      primaryCoachId: refs.coachMohamedId,
      schedule: { days: ["mon", "wed"], startTime: "18:00", endTime: "19:30" },
    },
    {
      id: "seed-group-kick-monster",
      name: "Kickboxing — Intermediate (Tue/Thu)",
      locationId: monsterId,
      disciplineId: kickboxingId,
      primaryCoachId: "seed-user-coach-tarek",
      schedule: { days: ["tue", "thu"], startTime: "19:00", endTime: "20:30" },
    },
    {
      id: "seed-group-mma-fc",
      name: "MMA — Advanced (Sat morning)",
      locationId: fightClubId,
      disciplineId: mmaId,
      primaryCoachId: "seed-user-coach-ali",
      schedule: { days: ["sat"], startTime: "10:00", endTime: "12:00" },
    },
    {
      id: "seed-group-karate-faculty",
      name: "Karate — Kihon (Sun/Tue)",
      locationId: facultyId,
      disciplineId: karateId,
      primaryCoachId: "seed-user-coach-karim",
      schedule: { days: ["sun", "tue"], startTime: "17:00", endTime: "18:30" },
    },
    {
      id: "seed-group-fitness-addfit",
      name: "Combat fitness (daily 6am)",
      locationId: addfitId,
      disciplineId: fitnessId,
      primaryCoachId: "seed-user-coach-tarek",
      schedule: { days: ["mon", "tue", "wed", "thu", "fri"], startTime: "06:00", endTime: "07:00" },
    },
  ];

  for (const g of groups) {
    await prisma.group.upsert({
      where: { id: g.id },
      create: {
        id: g.id,
        name: g.name,
        locationId: g.locationId,
        disciplineId: g.disciplineId,
        primaryCoachId: g.primaryCoachId,
        schedule: g.schedule as object,
        capacity: 20,
        active: true,
      },
      update: {},
    });
  }
  console.log(`  ✓ ${groups.length} groups`);

  // Enrollments + subscriptions
  const enrollments = [
    { id: "seed-enr-1", traineeId: refs.traineeAhmedId, groupId: "seed-group-boxing-fc-evening", fee: 1000 },
    { id: "seed-enr-2", traineeId: "seed-user-trainee-khaled", groupId: "seed-group-mma-fc", fee: 1200 },
    { id: "seed-enr-3", traineeId: "seed-user-trainee-yara", groupId: "seed-group-kick-monster", fee: 900 },
    { id: "seed-enr-4", traineeId: "seed-user-trainee-sara", groupId: "seed-group-boxing-fc-evening", fee: 1000 },
    { id: "seed-enr-5", traineeId: "seed-user-trainee-hassan", groupId: "seed-group-kick-monster", fee: 900 },
    { id: "seed-enr-6", traineeId: "seed-user-trainee-layla", groupId: "seed-group-karate-faculty", fee: 800 },
  ];
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const e of enrollments) {
    const group = groups.find((g) => g.id === e.groupId)!;
    const subId = `seed-sub-${e.id.replace("seed-enr-", "")}`;
    await prisma.subscription.upsert({
      where: { id: subId },
      create: {
        id: subId,
        traineeId: e.traineeId,
        groupId: e.groupId,
        locationId: group.locationId,
        disciplineId: group.disciplineId,
        monthlyFee: e.fee,
        sessionsPerMonth: 12,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        paymentStatus: "DUE",
        active: true,
      },
      update: {},
    });
    await prisma.enrollment.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        traineeId: e.traineeId,
        groupId: e.groupId,
        subscriptionId: subId,
        status: "ACTIVE",
      },
      update: {},
    });
  }
  console.log(`  ✓ ${enrollments.length} enrollments + subscriptions`);

  console.log("→ Seeding training units…");
  const units = [
    { id: "seed-unit-warmup", category: "warm-up", nameEn: "Dynamic warm-up", nameAr: "إحماء ديناميكي", difficulty: 1, durationSec: 600, body: ["shoulders_l", "shoulders_r", "hips"] },
    { id: "seed-unit-jab-cross", category: "technique", nameEn: "Jab-cross combination", nameAr: "جاب-كروس", difficulty: 2, durationSec: 180, rounds: 3, body: ["upper_arms_l", "upper_arms_r", "core_abs"], skills: ["jab", "cross"] },
    { id: "seed-unit-roundhouse", category: "technique", nameEn: "Roundhouse kick drill", nameAr: "ركلة دائرية", difficulty: 3, durationSec: 240, rounds: 4, body: ["thighs_l", "thighs_r", "core_abs"], skills: ["roundhouse"] },
    { id: "seed-unit-pushups", category: "strength", nameEn: "Push-ups (3×15)", nameAr: "ضغط ٣×١٥", difficulty: 2, durationSec: 180, body: ["chest", "upper_arms_l", "upper_arms_r"] },
    { id: "seed-unit-spar", category: "sparring", nameEn: "Light sparring", nameAr: "مباراة خفيفة", difficulty: 4, durationSec: 180, rounds: 3, body: ["head_neck", "core_abs"], skills: ["sparring", "defense"] },
    { id: "seed-unit-cooldown", category: "cool-down", nameEn: "Stretch & breathe", nameAr: "تمدد وتنفس", difficulty: 1, durationSec: 600, body: ["lower_back", "hips"] },
  ];
  for (const u of units) {
    await prisma.trainingUnit.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        nameAr: u.nameAr,
        nameEn: u.nameEn,
        category: u.category,
        targetBodyParts: u.body,
        targetSkills: u.skills ?? [],
        difficulty: u.difficulty,
        recommendedDurationSeconds: u.durationSec,
        recommendedRounds: u.rounds ?? null,
        recommendedRoundDurationSec: u.rounds ? Math.floor(u.durationSec / u.rounds) : null,
        equipmentRequired: [],
        published: true,
        version: 1,
        createdById: refs.headCoachId,
        disciplines: {
          create: [{ disciplineId: boxingId }, { disciplineId: kickboxingId }],
        },
      },
      update: {},
    });
  }
  console.log(`  ✓ ${units.length} published training units`);

  console.log("→ Seeding session plan + past session + attendance…");
  const planId = "seed-plan-1";
  const sessionDate = nextWeekday(now, 1, "18:00"); // next Monday 18:00 for plan
  const pastSessionStart = lastOccurrence(now, [1, 3], 18, 0);
  const pastSessionEnd = new Date(pastSessionStart);
  pastSessionEnd.setMinutes(pastSessionEnd.getMinutes() + 90);

  await prisma.sessionPlan.upsert({
    where: { id: planId },
    create: {
      id: planId,
      groupId: "seed-group-boxing-fc-evening",
      sessionDate,
      status: "APPROVED",
      unitsSequence: [
        { trainingUnitId: "seed-unit-warmup" },
        { trainingUnitId: "seed-unit-jab-cross" },
        { trainingUnitId: "seed-unit-pushups" },
        { trainingUnitId: "seed-unit-spar", notes: "Light contact only" },
        { trainingUnitId: "seed-unit-cooldown" },
      ],
      createdById: refs.coachMohamedId,
      reviewedById: refs.headCoachId,
      reviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    update: {},
  });

  const pastSessionId = "seed-session-past";
  await prisma.session.upsert({
    where: { id: pastSessionId },
    create: {
      id: pastSessionId,
      groupId: "seed-group-boxing-fc-evening",
      locationId: fightClubId,
      coachId: refs.coachMohamedId,
      scheduledStart: pastSessionStart,
      scheduledEnd: pastSessionEnd,
      actualStart: pastSessionStart,
      actualEnd: pastSessionEnd,
      status: "COMPLETED",
    },
    update: {},
  });

  // Attendance + quick evals for the boxing group's enrollees
  const boxingTrainees = [refs.traineeAhmedId, "seed-user-trainee-sara"];
  for (const tid of boxingTrainees) {
    await prisma.attendance.upsert({
      where: { sessionId_traineeId: { sessionId: pastSessionId, traineeId: tid } },
      create: {
        sessionId: pastSessionId,
        traineeId: tid,
        status: "PRESENT",
        markedById: refs.coachMohamedId,
      },
      update: {},
    });
    await prisma.quickEvaluation.upsert({
      where: { sessionId_traineeId: { sessionId: pastSessionId, traineeId: tid } },
      create: {
        sessionId: pastSessionId,
        traineeId: tid,
        effortScore: tid === refs.traineeAhmedId ? 9 : 7,
        notes: tid === refs.traineeAhmedId ? "Sharp jab today" : "Need more head movement",
        createdById: refs.coachMohamedId,
      },
      update: {},
    });
  }

  // Approved daily report
  await prisma.dailyReport.upsert({
    where: { sessionId: pastSessionId },
    create: {
      sessionId: pastSessionId,
      groupId: "seed-group-boxing-fc-evening",
      coachId: refs.coachMohamedId,
      submittedAt: new Date(pastSessionEnd.getTime() + 60 * 60 * 1000),
      status: "APPROVED",
      summary: "Solid focus on jab-cross and footwork. Two trainees attended.",
      reviewedById: refs.headCoachId,
      reviewedAt: new Date(),
      deliveredAt: new Date(),
    },
    update: {},
  });
  console.log("  ✓ approved plan + past session + attendance + report");

  console.log("→ Seeding medical clearance for Khaled…");
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  await prisma.medicalRecord.upsert({
    where: { traineeId: "seed-user-trainee-khaled" },
    create: {
      traineeId: "seed-user-trainee-khaled",
      bloodType: "O+",
      emergencyContactName: "Mahmoud Khaled",
      emergencyContactPhone: "+201000999999",
      emergencyContactRelation: "Brother",
    },
    update: {},
  });
  await prisma.medicalDocument.upsert({
    where: { id: "seed-meddoc-khaled-clearance" },
    create: {
      id: "seed-meddoc-khaled-clearance",
      traineeId: "seed-user-trainee-khaled",
      documentType: "CLEARANCE",
      fileUrl: "https://placeholder.csk.local/medical/khaled-clearance.pdf",
      issueDate: new Date(now.getFullYear(), 0, 15),
      expiryDate: oneYearFromNow,
      issuingDoctor: "Dr. Hassan Mostafa",
      status: "ACTIVE",
    },
    update: {},
  });
  console.log("  ✓ Khaled fully medically cleared");

  console.log("→ Seeding championship + result…");
  const champId = "seed-champ-mma-cup";
  const champStart = new Date(now);
  champStart.setMonth(champStart.getMonth() + 1);
  await prisma.championship.upsert({
    where: { id: champId },
    create: {
      id: champId,
      name: "Egyptian MMA Cup 2026",
      organizer: "Egyptian MMA Federation",
      isOfficial: true,
      locationLabel: "Cairo Sports Hall",
      startDate: champStart,
      endDate: new Date(champStart.getTime() + 24 * 60 * 60 * 1000),
      disciplines: [mmaId],
      weightCategories: ["65kg", "70kg", "77kg", "84kg"],
      ageCategories: ["seniors"],
      allowedLevels: ["B", "C"],
      registrationDeadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      registrationFee: 1500,
      createdById: refs.headCoachId,
    },
    update: {},
  });
  const regId = "seed-reg-khaled-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regId },
    create: {
      id: regId,
      championshipId: champId,
      traineeId: "seed-user-trainee-khaled",
      weightKg: 70,
      level: "B",
      isAmateur: true,
      status: "COACH_CONFIRMED",
      confirmedAt: new Date(),
    },
    update: {},
  });
  await prisma.fightResult.upsert({
    where: { id: "seed-fight-khaled-1" },
    create: {
      id: "seed-fight-khaled-1",
      registrationId: regId,
      opponentName: "Mahmoud Sayed",
      outcome: "WIN",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
      recordedById: refs.coachMohamedId,
    },
    update: {},
  });
  console.log("  ✓ championship + 1 confirmed registration + 1 win");

  console.log("→ Seeding belt exam pass for Ahmed…");
  const examId = "seed-exam-boxing-1";
  await prisma.beltExam.upsert({
    where: { id: examId },
    create: {
      id: examId,
      disciplineId: boxingId,
      examDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      locationLabel: "Federation HQ, Cairo",
      examinerName: "Master Ibrahim",
      federation: "Egyptian Boxing Federation",
      fee: 800,
    },
    update: {},
  });
  await prisma.beltExamResult.upsert({
    where: { examId_traineeId: { examId, traineeId: refs.traineeAhmedId } },
    create: {
      examId,
      traineeId: refs.traineeAhmedId,
      result: "PASSED",
      score: 85,
      newLevel: "A",
      recordedById: refs.headCoachId,
    },
    update: {},
  });
  console.log("  ✓ Ahmed passed his level-A boxing exam");

  console.log("→ Seeding merchandise…");
  const items = [
    { id: "seed-mrc-gloves", nameEn: "CSK 14oz Boxing Gloves", nameAr: "قفاز ملاكمة CSK ١٤ أونصة", category: "gloves", cost: 350, sale: 600, stock: 24, low: 5, photos: ["https://placeholder.csk.local/merch/gloves.jpg"] },
    { id: "seed-mrc-tshirt", nameEn: "CSK Combat Tee", nameAr: "تيشيرت CSK", category: "apparel", cost: 80, sale: 200, stock: 60, low: 10, photos: ["https://placeholder.csk.local/merch/tee.jpg"] },
    { id: "seed-mrc-wraps", nameEn: "Hand wraps (4m, pair)", nameAr: "لفافات يد ٤م", category: "wraps", cost: 25, sale: 75, stock: 100, low: 20 },
  ];
  for (const it of items) {
    await prisma.merchandiseItem.upsert({
      where: { id: it.id },
      create: {
        id: it.id,
        nameAr: it.nameAr,
        nameEn: it.nameEn,
        category: it.category,
        photos: it.photos ?? [],
        variants: it.id === "seed-mrc-tshirt" ? ["S-Black", "M-Black", "L-Black", "XL-Black"] : ([] as string[]),
        costPrice: it.cost,
        salePrice: it.sale,
        stockLevel: it.stock,
        lowStockThreshold: it.low,
        active: true,
      },
      update: {},
    });
  }
  console.log(`  ✓ ${items.length} merchandise items`);
}

// ─────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────

/** JS getDay: Sun=0, Mon=1, ... Sat=6. */
function nextWeekday(from: Date, weekday: number, hhmm: string): Date {
  const out = new Date(from);
  const diff = (weekday + 7 - out.getDay()) % 7 || 7;
  out.setDate(out.getDate() + diff);
  const [h, m] = hhmm.split(":").map(Number);
  out.setHours(h ?? 0, m ?? 0, 0, 0);
  return out;
}

/** Most recent past date matching one of the given JS-getDay values. */
function lastOccurrence(from: Date, weekdays: number[], h: number, m: number): Date {
  const out = new Date(from);
  for (let i = 1; i <= 14; i++) {
    out.setDate(out.getDate() - 1);
    if (weekdays.includes(out.getDay())) {
      out.setHours(h, m, 0, 0);
      return out;
    }
  }
  out.setHours(h, m, 0, 0);
  return out;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
