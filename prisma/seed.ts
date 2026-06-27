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
  const sysadminId = "seed-user-sysadmin";
  const adminId = "seed-user-admin";
  const headCoachId = "seed-user-head-coach"; // Saied Ibrahim
  const managingCoachId = "seed-user-managing-coach"; // Mariam Amr
  const coachId = "seed-user-coach";
  const traineeId = "seed-user-trainee";

  // 1. System Administrator (Controls the whole system)
  await prisma.user.upsert({
    where: { id: sysadminId },
    create: {
      id: sysadminId,
      role: "ADMIN",
      email: "sysadmin@csk.local",
      phone: "+201000000000",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "مدير النظام",
      fullNameEn: "System Administrator",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  // 2. Operations Admin (Manages attendance, allocating users, payment followups)
  await prisma.user.upsert({
    where: { id: adminId },
    create: {
      id: adminId,
      role: "ADMIN",
      email: "admin@csk.local",
      phone: "+201000000001",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "مسؤول العمليات",
      fullNameEn: "Operations Admin",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  // 3. Head Coach (Saied Ibrahim)
  await prisma.user.upsert({
    where: { id: headCoachId },
    create: {
      id: headCoachId,
      role: "HEAD_COACH",
      email: "saied@csk.local",
      phone: "+201000000002",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "كابتن سعيد ابراهيم",
      fullNameEn: "Cap. Saied Ibrahim",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  // 4. Managing Coach (Mariam Amr)
  await prisma.user.upsert({
    where: { id: managingCoachId },
    create: {
      id: managingCoachId,
      role: "HEAD_COACH",
      email: "mariam@csk.local",
      phone: "+201000000005",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "كابتن مريم عمرو",
      fullNameEn: "Cap. Mariam Amr",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  // 5. Coach (Ahmed Khallaf)
  await prisma.user.upsert({
    where: { id: coachId },
    create: {
      id: coachId,
      role: "COACH",
      email: "coach@csk.local",
      phone: "+201000000003",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "كابتن أحمد خلاف",
      fullNameEn: "Cap. Ahmed Khallaf",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      preferredLocale: "AR",
    },
    update: {},
  });

  // 6. Trainee
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

  console.log("  ✓ baseline users seeded (password: " + SEED_PASSWORD + ")");

  await seedDemoData({
    coachMohamedId: coachId,
    headCoachId,
    traineeAhmedId: traineeId,
  });

  console.log("\nSeed complete.");
  console.log("Login at /en/login or /ar/login with:");
  console.log("  sysadmin@csk.local     → SYSTEM ADMIN (ADMIN)");
  console.log("  admin@csk.local        → OPERATIONS ADMIN (ADMIN)");
  console.log("  saied@csk.local        → HEAD COACH (HEAD_COACH)");
  console.log("  mariam@csk.local       → MANAGING COACH (HEAD_COACH)");
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
    { id: "seed-user-coach-tarek", role: "COACH" as const, email: "tarek@csk.local", phone: "+201000000010", nameEn: "Cap. Nada", nameAr: "كابتن ندى", gender: "FEMALE" as const, dob: new Date("1993-04-12") },
    { id: "seed-user-coach-ali", role: "COACH" as const, email: "ali@csk.local", phone: "+201000000011", nameEn: "Coach Ali", nameAr: "كوتش علي", gender: "MALE" as const, dob: new Date("1992-09-18") },
    { id: "seed-user-coach-karim", role: "COACH" as const, email: "karim@csk.local", phone: "+201000000012", nameEn: "Coach Karim", nameAr: "كوتش كريم", gender: "MALE" as const, dob: new Date("1995-07-22") },
    { id: "seed-user-intern-omar", role: "INTERN" as const, email: "omar@csk.local", phone: "+201000000020", nameEn: "Intern Omar", nameAr: "عمر متدرب مدرب", gender: "MALE" as const, dob: new Date("2001-12-05") },
    { id: "seed-user-trainee-khaled", role: "TRAINEE" as const, email: "khaled@csk.local", phone: "+201000000030", nameEn: "Trainee Khaled", nameAr: "خالد متدرب", gender: "MALE" as const, dob: new Date("1996-05-12") },
    { id: "seed-user-trainee-yara", role: "TRAINEE" as const, email: "yara@csk.local", phone: "+201000000031", nameEn: "Trainee Yara", nameAr: "يارا متدربة", gender: "FEMALE" as const, dob: new Date("1999-08-20") },
    { id: "seed-user-trainee-sara", role: "TRAINEE" as const, email: "sara@csk.local", phone: "+201000000032", nameEn: "Trainee Sara", nameAr: "سارة متدربة", gender: "FEMALE" as const, dob: new Date("2000-02-14") },
    { id: "seed-user-trainee-hassan", role: "TRAINEE" as const, email: "hassan@csk.local", phone: "+201000000033", nameEn: "Trainee Hassan", nameAr: "حسن متدرب", gender: "MALE" as const, dob: new Date("1995-11-30") },
    { id: "seed-user-trainee-layla", role: "TRAINEE" as const, email: "layla@csk.local", phone: "+201000000034", nameEn: "Trainee Layla", nameAr: "ليلى متدربة", gender: "FEMALE" as const, dob: new Date("2002-04-05") },
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
        gender: u.gender,
        dob: u.dob,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        preferredLocale: "AR",
      },
      update: {
        gender: u.gender,
        dob: u.dob,
      },
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
      levelBands: ["N", "A", "B"] as ("N" | "A" | "B" | "C")[],
      coaches: [
        { coachId: refs.coachMohamedId, levels: ["N", "A"] as ("N" | "A" | "B" | "C")[] },
        { coachId: "seed-user-coach-tarek", levels: ["B"] as ("N" | "A" | "B" | "C")[] },
      ],
      interns: ["seed-user-intern-omar"],
      schedule: { days: ["sun", "mon", "wed"], startTime: "18:00", endTime: "19:30" },
    },
    {
      id: "seed-group-kick-monster",
      name: "Kickboxing — Intermediate (Tue/Thu)",
      locationId: monsterId,
      disciplineId: kickboxingId,
      levelBands: ["A", "B", "C"] as ("N" | "A" | "B" | "C")[],
      coaches: [
        { coachId: "seed-user-coach-tarek", levels: ["A", "B"] as ("N" | "A" | "B" | "C")[] },
        { coachId: "seed-user-coach-ali", levels: ["C"] as ("N" | "A" | "B" | "C")[] },
      ],
      interns: [] as string[],
      schedule: { days: ["tue", "thu"], startTime: "19:00", endTime: "20:30" },
    },
    {
      id: "seed-group-mma-fc",
      name: "MMA — Advanced (Sat morning)",
      locationId: fightClubId,
      disciplineId: mmaId,
      levelBands: ["B", "C"] as ("N" | "A" | "B" | "C")[],
      coaches: [
        { coachId: "seed-user-coach-ali", levels: ["B", "C"] as ("N" | "A" | "B" | "C")[] },
      ],
      interns: [] as string[],
      schedule: { days: ["sat"], startTime: "10:00", endTime: "12:00" },
    },
    {
      id: "seed-group-karate-faculty",
      name: "Karate — Kihon (Sun/Tue)",
      locationId: facultyId,
      disciplineId: karateId,
      levelBands: ["N", "A"] as ("N" | "A" | "B" | "C")[],
      coaches: [
        { coachId: "seed-user-coach-karim", levels: ["N", "A"] as ("N" | "A" | "B" | "C")[] },
      ],
      interns: [] as string[],
      schedule: { days: ["sun", "tue"], startTime: "17:00", endTime: "18:30" },
    },
    {
      id: "seed-group-fitness-addfit",
      name: "Combat fitness (daily 6am)",
      locationId: addfitId,
      disciplineId: fitnessId,
      levelBands: ["N"] as ("N" | "A" | "B" | "C")[],
      coaches: [
        { coachId: "seed-user-coach-tarek", levels: ["N"] as ("N" | "A" | "B" | "C")[] },
      ],
      interns: [] as string[],
      schedule: { days: ["mon", "tue", "wed", "thu", "fri"], startTime: "06:00", endTime: "07:00" },
    },
  ];

  for (const g of groups) {
    // Delete existing assignments for idempotency
    await prisma.groupCoachAssignment.deleteMany({ where: { groupId: g.id } });
    await prisma.groupInternAssignment.deleteMany({ where: { groupId: g.id } });

    await prisma.group.upsert({
      where: { id: g.id },
      create: {
        id: g.id,
        name: g.name,
        locationId: g.locationId,
        disciplineId: g.disciplineId,
        levelBands: g.levelBands,
        schedule: g.schedule as object,
        capacity: 20,
        active: true,
        coaches: {
          create: g.coaches.map((c) => ({
            coachId: c.coachId,
            levels: c.levels,
          })),
        },
        interns: {
          create: g.interns.map((i) => ({
            internId: i,
          })),
        },
      },
      update: {
        name: g.name,
        locationId: g.locationId,
        disciplineId: g.disciplineId,
        levelBands: g.levelBands,
        schedule: g.schedule as object,
        capacity: 20,
        active: true,
        coaches: {
          create: g.coaches.map((c) => ({
            coachId: c.coachId,
            levels: c.levels,
          })),
        },
        interns: {
          create: g.interns.map((i) => ({
            internId: i,
          })),
        },
      },
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

  console.log("→ Seeding championship + results + matchups…");
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

  // 1. Khaled (PAID, Public)
  const regKhaledId = "seed-reg-khaled-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regKhaledId },
    create: {
      id: regKhaledId,
      championshipId: champId,
      traineeId: "seed-user-trainee-khaled",
      weightKg: 70,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "PAID",
      confirmedAt: new Date(),
      instapayRef: "TXN987654",
      paymentReceiptUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-001",
    },
    update: {
      status: "PAID",
      fightClass: "AMATEUR",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-001",
    },
  });

  // 2. Hassan (PAID, Public)
  const regHassanId = "seed-reg-hassan-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regHassanId },
    create: {
      id: regHassanId,
      championshipId: champId,
      traineeId: "seed-user-trainee-hassan",
      weightKg: 72,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "PAID",
      confirmedAt: new Date(),
      instapayRef: "TXN987655",
      paymentReceiptUrl: "https://images.unsplash.com/photo-1555541865-c49b06830cc7?w=500&auto=format&fit=crop&q=60",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-002",
    },
    update: {
      status: "PAID",
      fightClass: "AMATEUR",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-002",
    },
  });

  // 3. Yara (PENDING_VERIFICATION, Private)
  const regYaraId = "seed-reg-yara-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regYaraId },
    create: {
      id: regYaraId,
      championshipId: champId,
      traineeId: "seed-user-trainee-yara",
      weightKg: 62,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "PENDING_VERIFICATION",
      confirmedAt: new Date(),
      instapayRef: "TXN987656",
      paymentReceiptUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=500&auto=format&fit=crop&q=60",
      isProfilePublic: false,
      registrationNumber: "CSK-CH-003",
    },
    update: {
      status: "PENDING_VERIFICATION",
      fightClass: "AMATEUR",
      isProfilePublic: false,
      registrationNumber: "CSK-CH-003",
    },
  });

  // 4. Sara (PAID, Public)
  const regSaraId = "seed-reg-sara-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regSaraId },
    create: {
      id: regSaraId,
      championshipId: champId,
      traineeId: "seed-user-trainee-sara",
      weightKg: 64,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "PAID",
      confirmedAt: new Date(),
      instapayRef: "TXN987657",
      paymentReceiptUrl: "https://images.unsplash.com/photo-1555541865-c49b06830cc7?w=500&auto=format&fit=crop&q=60",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-004",
    },
    update: {
      status: "PAID",
      fightClass: "AMATEUR",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-004",
    },
  });

  // 5. Layla (COACH_CONFIRMED, Private)
  const regLaylaId = "seed-reg-layla-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regLaylaId },
    create: {
      id: regLaylaId,
      championshipId: champId,
      traineeId: "seed-user-trainee-layla",
      weightKg: 61,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "COACH_CONFIRMED",
      confirmedAt: new Date(),
      isProfilePublic: false,
      registrationNumber: "CSK-CH-005",
    },
    update: {
      status: "COACH_CONFIRMED",
      fightClass: "AMATEUR",
      isProfilePublic: false,
      registrationNumber: "CSK-CH-005",
    },
  });

  // 6. Trainee Ahmed (PAID, Public)
  const regAhmedId = "seed-reg-ahmed-mma";
  await prisma.championshipRegistration.upsert({
    where: { id: regAhmedId },
    create: {
      id: regAhmedId,
      championshipId: champId,
      traineeId: refs.traineeAhmedId,
      weightKg: 71,
      level: "B",
      fightClass: "AMATEUR",
      isAmateur: true,
      status: "PAID",
      confirmedAt: new Date(),
      instapayRef: "TXN987658",
      paymentReceiptUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-006",
    },
    update: {
      status: "PAID",
      fightClass: "AMATEUR",
      isProfilePublic: true,
      registrationNumber: "CSK-CH-006",
    },
  });

  // Match 1: Khaled vs Ahmed (Completed, Khaled wins)
  const match1Id = "seed-match-khaled-ahmed";
  await prisma.match.upsert({
    where: { id: match1Id },
    create: {
      id: match1Id,
      championshipId: champId,
      fighter1Id: regKhaledId,
      fighter2Id: regAhmedId,
      gender: "MALE",
      fightClass: "AMATEUR",
      weightClass: "71 kg",
      round: 2,
      outcome: "WIN",
      method: "KO",
      timeInRound: "1:45",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      winnerId: regKhaledId,
      notes: "CSK MMA Cup Semifinal Bout",
    },
    update: {
      winnerId: regKhaledId,
      outcome: "WIN",
      method: "KO",
      round: 2,
      timeInRound: "1:45",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  });

  await prisma.fightResult.upsert({
    where: { id: "seed-fight-khaled-1" },
    create: {
      id: "seed-fight-khaled-1",
      registrationId: regKhaledId,
      opponentName: "Trainee Ahmed",
      outcome: "WIN",
      method: "KO",
      round: 2,
      timeInRound: "1:45",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      recordedById: refs.coachMohamedId,
    },
    update: {
      opponentName: "Trainee Ahmed",
      outcome: "WIN",
      method: "KO",
      round: 2,
      timeInRound: "1:45",
    },
  });

  await prisma.fightResult.upsert({
    where: { id: "seed-fight-ahmed-1" },
    create: {
      id: "seed-fight-ahmed-1",
      registrationId: regAhmedId,
      opponentName: "Trainee Khaled",
      outcome: "LOSS",
      method: "KO",
      round: 2,
      timeInRound: "1:45",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      recordedById: refs.coachMohamedId,
    },
    update: {
      opponentName: "Trainee Khaled",
      outcome: "LOSS",
      method: "KO",
      round: 2,
      timeInRound: "1:45",
    },
  });

  // Match 2: Sara vs Yara (Completed, Sara wins)
  const match2Id = "seed-match-sara-yara";
  await prisma.match.upsert({
    where: { id: match2Id },
    create: {
      id: match2Id,
      championshipId: champId,
      fighter1Id: regSaraId,
      fighter2Id: regYaraId,
      gender: "FEMALE",
      fightClass: "AMATEUR",
      weightClass: "63 kg",
      round: 3,
      outcome: "WIN",
      method: "DECISION",
      timeInRound: "5:00",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      winnerId: regSaraId,
      notes: "CSK MMA Cup Female division bout",
    },
    update: {
      winnerId: regSaraId,
      outcome: "WIN",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  });

  await prisma.fightResult.upsert({
    where: { id: "seed-fight-sara-1" },
    create: {
      id: "seed-fight-sara-1",
      registrationId: regSaraId,
      opponentName: "Trainee Yara",
      outcome: "WIN",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      recordedById: refs.coachMohamedId,
    },
    update: {
      opponentName: "Trainee Yara",
      outcome: "WIN",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
    },
  });

  await prisma.fightResult.upsert({
    where: { id: "seed-fight-yara-1" },
    create: {
      id: "seed-fight-yara-1",
      registrationId: regYaraId,
      opponentName: "Trainee Sara",
      outcome: "LOSS",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      recordedById: refs.coachMohamedId,
    },
    update: {
      opponentName: "Trainee Sara",
      outcome: "LOSS",
      method: "DECISION",
      round: 3,
      timeInRound: "5:00",
    },
  });

  // Match 3: Hassan vs Ahmed (Active/Scheduled, no winner yet)
  const match3Id = "seed-match-hassan-ahmed";
  await prisma.match.upsert({
    where: { id: match3Id },
    create: {
      id: match3Id,
      championshipId: champId,
      fighter1Id: regHassanId,
      fighter2Id: regAhmedId,
      gender: "MALE",
      fightClass: "AMATEUR",
      weightClass: "71.5 kg",
      notes: "CSK MMA Cup Finals",
    },
    update: {},
  });

  console.log("  ✓ championship + registrations + complete matchmaking cycle seeded");

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

  console.log("→ Seeding pending user approval…");
  await prisma.user.upsert({
    where: { id: "seed-user-pending-trainee" },
    create: {
      id: "seed-user-pending-trainee",
      role: "TRAINEE",
      email: "pending.trainee@csk.local",
      phone: "+201000000099",
      passwordHash: await hash(SEED_PASSWORD),
      fullNameAr: "متدرب قيد الانتظار",
      fullNameEn: "Pending Trainee",
      status: "PENDING",
      emailVerifiedAt: null,
      preferredLocale: "AR",
    },
    update: { status: "PENDING" },
  });

  console.log("→ Seeding payments and splits…");
  await prisma.subscription.update({
    where: { id: "seed-sub-1" },
    data: { paymentStatus: "PAID" },
  });
  await prisma.subscription.update({
    where: { id: "seed-sub-3" },
    data: { paymentStatus: "PAID" },
  });

  const pay1 = await prisma.payment.upsert({
    where: { receiptNumber: "REC-SUB-1" },
    create: {
      id: "seed-payment-sub-1",
      revenueType: "SUBSCRIPTION",
      subscriptionId: "seed-sub-1",
      payerUserId: refs.traineeAhmedId,
      amountGross: 1000,
      amountNet: 1000,
      currency: "EGP",
      method: "CASH",
      receiptNumber: "REC-SUB-1",
      paidAt: periodStart,
      loggedById: "seed-user-admin",
    },
    update: { subscriptionId: "seed-sub-1" },
  });

  const pay3 = await prisma.payment.upsert({
    where: { receiptNumber: "REC-SUB-3" },
    create: {
      id: "seed-payment-sub-3",
      revenueType: "SUBSCRIPTION",
      subscriptionId: "seed-sub-3",
      payerUserId: "seed-user-trainee-yara",
      amountGross: 900,
      amountNet: 900,
      currency: "EGP",
      method: "VODAFONE_CASH",
      receiptNumber: "REC-SUB-3",
      paidAt: periodStart,
      loggedById: "seed-user-admin",
    },
    update: { subscriptionId: "seed-sub-3" },
  });

  await prisma.revenueSplit.deleteMany({
    where: { paymentId: { in: [pay1.id, pay3.id] } },
  });

  await prisma.revenueSplit.createMany({
    data: [
      {
        paymentId: pay1.id,
        recipientType: "CSK",
        amount: 850,
        percent: 85,
        computedAt: periodStart,
      },
      {
        paymentId: pay1.id,
        recipientType: "COACH",
        recipientUserId: refs.coachMohamedId,
        amount: 150,
        percent: 15,
        computedAt: periodStart,
      },
      {
        paymentId: pay3.id,
        recipientType: "VENUE",
        recipientLocationId: "seed-loc-monster-gym",
        amount: 540,
        percent: 60,
        computedAt: periodStart,
      },
      {
        paymentId: pay3.id,
        recipientType: "CSK",
        amount: 225,
        percent: 25,
        computedAt: periodStart,
      },
      {
        paymentId: pay3.id,
        recipientType: "COACH",
        recipientUserId: "seed-user-coach-tarek",
        amount: 135,
        percent: 15,
        computedAt: periodStart,
      },
    ],
  });

  console.log("→ Seeding overdue subscriptions…");
  await prisma.subscription.update({
    where: { id: "seed-sub-4" },
    data: { paymentStatus: "OVERDUE" },
  });
  await prisma.subscription.update({
    where: { id: "seed-sub-5" },
    data: { paymentStatus: "OVERDUE" },
  });

  console.log("→ Seeding expiring/expired medical documents…");
  const in5Days = new Date(now);
  in5Days.setDate(in5Days.getDate() + 5);

  const expired2DaysAgo = new Date(now);
  expired2DaysAgo.setDate(expired2DaysAgo.getDate() - 2);

  await prisma.medicalRecord.upsert({
    where: { traineeId: "seed-user-trainee-sara" },
    create: {
      traineeId: "seed-user-trainee-sara",
      bloodType: "A-",
      emergencyContactName: "Sara Parent",
      emergencyContactPhone: "+201000999991",
    },
    update: {},
  });

  await prisma.medicalRecord.upsert({
    where: { traineeId: "seed-user-trainee-hassan" },
    create: {
      traineeId: "seed-user-trainee-hassan",
      bloodType: "B+",
      emergencyContactName: "Hassan Parent",
      emergencyContactPhone: "+201000999992",
    },
    update: {},
  });

  await prisma.medicalDocument.upsert({
    where: { id: "seed-meddoc-sara-expiring" },
    create: {
      id: "seed-meddoc-sara-expiring",
      traineeId: "seed-user-trainee-sara",
      documentType: "CLEARANCE",
      fileUrl: "https://placeholder.csk.local/medical/sara-clearance.pdf",
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      expiryDate: in5Days,
      status: "ACTIVE",
    },
    update: { expiryDate: in5Days, status: "ACTIVE" },
  });

  await prisma.medicalDocument.upsert({
    where: { id: "seed-meddoc-hassan-expired" },
    create: {
      id: "seed-meddoc-hassan-expired",
      traineeId: "seed-user-trainee-hassan",
      documentType: "CLEARANCE",
      fileUrl: "https://placeholder.csk.local/medical/hassan-clearance.pdf",
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      expiryDate: expired2DaysAgo,
      status: "ACTIVE",
    },
    update: { expiryDate: expired2DaysAgo, status: "ACTIVE" },
  });

  console.log("→ Seeding pending session plan…");
  const planPendingDate = nextWeekday(now, 2, "19:00");
  await prisma.sessionPlan.upsert({
    where: { id: "seed-plan-pending-1" },
    create: {
      id: "seed-plan-pending-1",
      groupId: "seed-group-kick-monster",
      sessionDate: planPendingDate,
      status: "PENDING",
      unitsSequence: [
        { trainingUnitId: "seed-unit-warmup" },
        { trainingUnitId: "seed-unit-roundhouse" },
        { trainingUnitId: "seed-unit-cooldown" },
      ],
      createdById: "seed-user-coach-tarek",
    },
    update: { status: "PENDING" },
  });

  console.log("→ Seeding rejected session plan…");
  const planRejectedDate = nextWeekday(now, 3, "18:00");
  await prisma.sessionPlan.upsert({
    where: { id: "seed-plan-rejected-1" },
    create: {
      id: "seed-plan-rejected-1",
      groupId: "seed-group-boxing-fc-evening",
      sessionDate: planRejectedDate,
      status: "REJECTED",
      unitsSequence: [
        { trainingUnitId: "seed-unit-warmup" },
        { trainingUnitId: "seed-unit-pushups" },
        { trainingUnitId: "seed-unit-cooldown" },
      ],
      createdById: refs.coachMohamedId,
      reviewedById: refs.headCoachId,
      reviewedAt: new Date(),
      rejectionComment: "Please specify skill details for sparring or increase intensity.",
    },
    update: { status: "REJECTED", rejectionComment: "Please specify skill details for sparring or increase intensity." },
  });

  console.log("→ Seeding past session with pending daily report…");
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(18, 0, 0, 0);

  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setMinutes(yesterdayEnd.getMinutes() + 90);

  const pendingSessionId = "seed-session-pending-report";
  await prisma.session.upsert({
    where: { id: pendingSessionId },
    create: {
      id: pendingSessionId,
      groupId: "seed-group-boxing-fc-evening",
      locationId: "seed-loc-fight-club",
      coachId: refs.coachMohamedId,
      scheduledStart: yesterdayStart,
      scheduledEnd: yesterdayEnd,
      actualStart: yesterdayStart,
      actualEnd: yesterdayEnd,
      status: "COMPLETED",
    },
    update: {},
  });

  for (const tid of boxingTrainees) {
    await prisma.attendance.upsert({
      where: { sessionId_traineeId: { sessionId: pendingSessionId, traineeId: tid } },
      create: {
        sessionId: pendingSessionId,
        traineeId: tid,
        status: "PRESENT",
        markedById: refs.coachMohamedId,
      },
      update: {},
    });
    await prisma.quickEvaluation.upsert({
      where: { sessionId_traineeId: { sessionId: pendingSessionId, traineeId: tid } },
      create: {
        sessionId: pendingSessionId,
        traineeId: tid,
        effortScore: tid === refs.traineeAhmedId ? 8 : 6,
        notes: "Attended yesterday.",
        createdById: refs.coachMohamedId,
      },
      update: {},
    });
  }

  await prisma.dailyReport.upsert({
    where: { sessionId: pendingSessionId },
    create: {
      sessionId: pendingSessionId,
      groupId: "seed-group-boxing-fc-evening",
      coachId: refs.coachMohamedId,
      submittedAt: new Date(yesterdayEnd.getTime() + 30 * 60 * 1000),
      status: "PENDING",
      summary: "Practiced standard guard positions and light punches. Good effort by everyone.",
    },
    update: { status: "PENDING" },
  });

  console.log("→ Seeding private sessions…");
  const privateTodayStart = new Date(now);
  privateTodayStart.setHours(15, 0, 0, 0);
  const privateTodayEnd = new Date(privateTodayStart);
  privateTodayEnd.setHours(16, 0, 0, 0);

  await prisma.privateSession.upsert({
    where: { id: "seed-private-1" },
    create: {
      id: "seed-private-1",
      traineeId: refs.traineeAhmedId,
      coachId: refs.coachMohamedId,
      locationId: "seed-loc-fight-club",
      scheduledStart: privateTodayStart,
      scheduledEnd: privateTodayEnd,
      fee: 400,
      status: "SCHEDULED",
      notes: "Focus on boxing footwork.",
    },
    update: { status: "SCHEDULED" },
  });

  const sessionTodayId = "seed-session-today-boxing";
  const todayBoxingStart = new Date(now);
  todayBoxingStart.setHours(18, 0, 0, 0);
  const todayBoxingEnd = new Date(todayBoxingStart);
  todayBoxingEnd.setHours(19, 30, 0, 0);

  await prisma.session.upsert({
    where: { id: sessionTodayId },
    create: {
      id: sessionTodayId,
      groupId: "seed-group-boxing-fc-evening",
      locationId: "seed-loc-fight-club",
      coachId: refs.coachMohamedId,
      scheduledStart: todayBoxingStart,
      scheduledEnd: todayBoxingEnd,
      status: "SCHEDULED",
    },
    update: {},
  });

  // ─────────────────────────────────────────────────────────────────
  // SEED THE SPECIAL GROUP: النادي الساعة 9
  // ─────────────────────────────────────────────────────────────────
  console.log("→ Seeding target group النادي الساعة 9 (cmplzzcce0001b82aduql3nfn)…");
  const specialGroupId = "cmplzzcce0001b82aduql3nfn";
  
  // Clean up existing assignments for idempotency
  await prisma.groupCoachAssignment.deleteMany({ where: { groupId: specialGroupId } });
  await prisma.groupInternAssignment.deleteMany({ where: { groupId: specialGroupId } });

  await prisma.group.upsert({
    where: { id: specialGroupId },
    create: {
      id: specialGroupId,
      name: "النادي الساعة 9",
      locationId: "seed-loc-benha-sports-club",
      disciplineId: "seed-disc-kickboxing",
      levelBands: ["N", "A", "B", "C"],
      schedule: {
        days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
        startTime: "21:00",
        endTime: "22:30"
      },
      capacity: 30,
      active: true,
      coaches: {
        create: [
          { coachId: refs.coachMohamedId, levels: ["N", "A", "B", "C"] }
        ]
      }
    },
    update: {
      name: "النادي الساعة 9",
      locationId: "seed-loc-benha-sports-club",
      disciplineId: "seed-disc-kickboxing",
      levelBands: ["N", "A", "B", "C"],
      schedule: {
        days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
        startTime: "21:00",
        endTime: "22:30"
      },
      capacity: 30,
      active: true,
    }
  });

  // Seed the 18 trainees
  const specialTrainees = [
    { nameAr: "يوسف أحمد عفيفي", nameEn: "Yousef Ahmed Afify", phone: "01108712497", dob: new Date("2006-01-01") },
    { nameAr: "عبد الرحمن إكرامي السيد", nameEn: "Abd el Rahman Ekramy el Sayed", phone: "01553231823", dob: new Date("2008-01-01") },
    { nameAr: "عمر حازم", nameEn: "Omar Hazem", phone: "01080774880", dob: new Date("2019-01-01") },
    { nameAr: "آسر حازم", nameEn: "Aser Hazem", phone: null, dob: new Date("2021-01-01") },
    { nameAr: "السيد مصطفى السيد", nameEn: "El Sayed Mostafa El Sayed", phone: "01090334444", dob: new Date("2013-01-01") },
    { nameAr: "عبد الرحمن أحمد إبراهيم", nameEn: "Abd el Rahman Ahmed Ibrahim", phone: "01144350961", dob: new Date("2017-01-01") },
    { nameAr: "علي أحمد النساج", nameEn: "Aly Ahmed El Nassag", phone: "01140696960", dob: new Date("2020-01-01") },
    { nameAr: "عبد الباري محمد محمد", nameEn: "Abd el Bary Mohamed Mohamed", phone: "01558246968", dob: new Date("2009-01-01") },
    { nameAr: "يوسف أيمن مهدي", nameEn: "Yossef Ayman Mahdy", phone: "01150167646", dob: new Date("2004-01-01") },
    { nameAr: "محمد مختار محمد", nameEn: "Mohamed Mokhtar Mohamed", phone: "0106064122", dob: new Date("2019-01-01") },
    { nameAr: "إسلام السيد حسن", nameEn: "Eslam El Sayed Hassan", phone: "01060031307", dob: new Date("2003-01-01") },
    { nameAr: "يوسف تامر رمضان", nameEn: "Yossef Tamer Ramadan", phone: "01220450250", dob: new Date("2011-01-01") },
    { nameAr: "عبد الله محمد مصطفى", nameEn: "Abdullah Mohamed Mostafa", phone: "01204570774", dob: new Date("2009-01-01") },
    { nameAr: "أحمد محمد أحمد", nameEn: "Ahmed Mohamed Ahmed", phone: "01004227393", dob: new Date("2018-01-01") },
    { nameAr: "ميرا مجدي ماهر", nameEn: "Mira Magdy Maher", phone: "01555474217", dob: new Date("2009-01-01") },
    { nameAr: "آية حسين نور الدين", nameEn: "Aya Hussein Nour El Din", phone: "01240799650", dob: new Date("2012-01-01") },
    { nameAr: "سارة حسين نور الدين", nameEn: "Sara Hussein Nour El Din", phone: "01105031493", dob: new Date("2011-01-01") },
    { nameAr: "ردينا سعيد أحمد", nameEn: "Rodina Saeed Ahmed", phone: "01280389995", dob: new Date("2004-01-01") }
  ];

  const pwHash = await hash(SEED_PASSWORD);

  for (const t of specialTrainees) {
    const emailPrefix = t.nameEn.toLowerCase().replace(/[^a-z0-9]/g, ".");
    const email = `${emailPrefix}@csk.local`;

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        role: "TRAINEE",
        email,
        phone: t.phone,
        passwordHash: pwHash,
        fullNameAr: t.nameAr,
        fullNameEn: t.nameEn,
        dob: t.dob,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        preferredLocale: "AR"
      },
      update: {
        phone: t.phone,
        fullNameAr: t.nameAr,
        fullNameEn: t.nameEn,
        dob: t.dob,
        status: "ACTIVE"
      }
    });

    const subId = `sub-auto-${user.id.substring(0, 10)}-${specialGroupId.substring(0, 10)}`;
    await prisma.subscription.upsert({
      where: { id: subId },
      create: {
        id: subId,
        traineeId: user.id,
        groupId: specialGroupId,
        locationId: "seed-loc-benha-sports-club",
        disciplineId: "seed-disc-kickboxing",
        monthlyFee: 1000,
        sessionsPerMonth: 12,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        paymentStatus: "DUE",
        active: true
      },
      update: {}
    });

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        traineeId: user.id,
        groupId: specialGroupId,
        status: "ACTIVE"
      }
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          traineeId: user.id,
          groupId: specialGroupId,
          subscriptionId: subId,
          status: "ACTIVE"
        }
      });
    }
  }

  // Seed the live active session today
  const specialSessionTodayId = "cmpm049ip000ub82aem7j55j5";
  const todayStart = new Date(now);
  todayStart.setHours(21, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(22, 30, 0, 0);

  await prisma.session.upsert({
    where: { id: specialSessionTodayId },
    create: {
      id: specialSessionTodayId,
      groupId: specialGroupId,
      locationId: "seed-loc-benha-sports-club",
      coachId: refs.coachMohamedId,
      scheduledStart: todayStart,
      scheduledEnd: todayEnd,
      status: "IN_PROGRESS"
    },
    update: {
      groupId: specialGroupId,
      locationId: "seed-loc-benha-sports-club",
      coachId: refs.coachMohamedId,
      scheduledStart: todayStart,
      scheduledEnd: todayEnd,
      status: "IN_PROGRESS"
    }
  });

  console.log("  ✓ Special group, 18 trainees, and session today seeded successfully!");
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
