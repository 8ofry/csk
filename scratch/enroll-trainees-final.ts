import { prisma } from "../src/infrastructure/db/prisma";
import argon2 from "argon2";

const traineesList = [
  // Right column
  { nameAr: "يوسف أحمد عفيفي", nameEn: "Yousef Ahmed Afify", phone: "01108712497", dob: new Date("2006-01-01") },
  { nameAr: "عبد الرحمن إكرامي السيد", nameEn: "Abd el Rahman Ekramy el Sayed", phone: "01553231823", dob: new Date("2008-01-01") },
  { nameAr: "عمر حازم", nameEn: "Omar Hazem", phone: "01080774880", dob: new Date("2019-01-01") },
  { nameAr: "آسر حازم", nameEn: "Aser Hazem", phone: "01080774880", dob: new Date("2021-01-01") }, // Note: same parent/phone as Omar Hazem
  { nameAr: "السيد مصطفى السيد", nameEn: "El Sayed Mostafa El Sayed", phone: "01090334444", dob: new Date("2013-01-01") },
  { nameAr: "عبد الرحمن أحمد إبراهيم", nameEn: "Abd el Rahman Ahmed Ibrahim", phone: "01144350961", dob: new Date("2017-01-01") },
  { nameAr: "علي أحمد النساج", nameEn: "Aly Ahmed El Nassag", phone: "01140696960", dob: new Date("2020-01-01") },
  { nameAr: "عبد الباري محمد محمد", nameEn: "Abd el Bary Mohamed Mohamed", phone: "01558246968", dob: new Date("2009-01-01") },
  { nameAr: "يوسف أيمن مهدي", nameEn: "Yossef Ayman Mahdy", phone: "01150167646", dob: new Date("2004-01-01") },

  // Left column
  { nameAr: "محمد مختار محمد", nameEn: "Mohamed Mokhtar Mohamed", phone: "0106064122", dob: new Date("2019-01-01") },
  { nameAr: "إسلام السيد حسن", nameEn: "Eslam El Sayed Hassan", phone: "01060031307", dob: new Date("2003-01-01") },
  { nameAr: "يوسف تامر رمضان", nameEn: "Yossef Tamer Ramadan", phone: "01220450250", dob: new Date("2011-01-01") },
  { nameAr: "عبد الله محمد مصطفى", nameEn: "Abdullah Mohamed Mostafa", phone: "01204570774", dob: new Date("2009-01-01") },
  { nameAr: "أحمد محمد أحمد", nameEn: "Ahmed Mohamed Ahmed", phone: "01004227393", dob: new Date("2018-01-01") },
  { nameAr: "ميرا مجدي ماهر", nameEn: "Mira Magdy Maher", phone: "01555474217", dob: new Date("2009-01-01") },
  { nameAr: "آية حسين نور الدين", nameEn: "Aya Hussein Nour El Din", phone: "01240799650", dob: new Date("2012-01-01") },
  { nameAr: "سارة حسين نور الدين", nameEn: "Sara Hussein Nour El Din", phone: "01105031493", dob: new Date("2011-01-01") },
  { nameAr: "ردينا سعيد أحمد", nameEn: "Rodina Saeed Ahmed", phone: "01280389995", dob: new Date("2004-01-01") },
];

const SEED_PASSWORD = "Csk!2026";
const TARGET_GROUP_ID = "cmpk0s3xo0001eg003aehls2l"; // النادي الساعة 9

async function main() {
  const group = await prisma.group.findUnique({
    where: { id: TARGET_GROUP_ID },
    include: { location: true, discipline: true }
  });

  if (!group) {
    throw new Error(`Target group with ID ${TARGET_GROUP_ID} not found!`);
  }

  console.log(`Target Group: ${group.name}`);
  console.log(`Location: ${group.location.nameEn}`);
  console.log(`Discipline: ${group.discipline.nameEn}\n`);

  const passwordHash = await argon2.hash(SEED_PASSWORD);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const t of traineesList) {
    console.log(`Processing: ${t.nameEn} (${t.nameAr})...`);

    // 1. Create or Find User
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: t.phone },
          { fullNameEn: t.nameEn },
          { fullNameAr: t.nameAr },
        ]
      }
    });

    if (!user) {
      // Generate standard email
      const emailPrefix = t.nameEn.toLowerCase().replace(/[^a-z0-9]/g, ".");
      let email = `${emailPrefix}@csk.local`;
      
      // Ensure unique email (in case of conflict)
      let count = 1;
      while (await prisma.user.findUnique({ where: { email } })) {
        email = `${emailPrefix}${count}@csk.local`;
        count++;
      }

      user = await prisma.user.create({
        data: {
          role: "TRAINEE",
          email,
          phone: t.phone,
          passwordHash,
          fullNameAr: t.nameAr,
          fullNameEn: t.nameEn,
          dob: t.dob,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
          preferredLocale: "AR"
        }
      });
      console.log(`  ✓ Created user ${user.fullNameEn} with email ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`  ✓ Found existing user ${user.fullNameEn} (ID: ${user.id})`);
    }

    // 2. Check if already enrolled in the target group
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        traineeId: user.id,
        groupId: TARGET_GROUP_ID,
        status: "ACTIVE"
      }
    });

    if (!existingEnrollment) {
      // Create Subscription first to keep database state solid and healthy
      const subId = `sub-auto-${user.id.substring(0, 10)}-${group.id.substring(0, 10)}`;
      
      let subscription = await prisma.subscription.findUnique({
        where: { id: subId }
      });

      if (!subscription) {
        subscription = await prisma.subscription.create({
          data: {
            id: subId,
            traineeId: user.id,
            groupId: group.id,
            locationId: group.locationId,
            disciplineId: group.disciplineId,
            monthlyFee: 1000, // standard default fee
            sessionsPerMonth: 12,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            paymentStatus: "DUE",
            active: true
          }
        });
        console.log(`  ✓ Created subscription for monthly fee: 1000 EGP`);
      }

      // Create Enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          traineeId: user.id,
          groupId: group.id,
          subscriptionId: subscription.id,
          status: "ACTIVE"
        }
      });
      console.log(`  ✓ Enrolled in group ${group.name} (Enrollment ID: ${enrollment.id})`);
    } else {
      console.log(`  ✓ Already enrolled in group ${group.name}`);
    }
  }

  console.log("\nAll trainees enrolled successfully!");
}

main().catch(console.error);
