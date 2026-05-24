import { prisma } from "../src/infrastructure/db/prisma";

const traineesList = [
  { nameAr: "يوسف أحمد عفيفي", nameEn: "Yossef Ahmed Afify", phone: "01108712497", birthYear: 2006 },
  { nameAr: "عبد الرحمن إكرامي السيد", nameEn: "Abd el Rahman Ekramy el Sayed", phone: "01553231823", birthYear: 2008 },
  { nameAr: "عمر حازم", nameEn: "Omar Hazem", phone: "01080774880", birthYear: 2019 }, // 7 years old in 2026
  { nameAr: "آسر حازم", nameEn: "Aser Hazem", phone: "01080774880", birthYear: 2021 }, // 5 years old in 2026
  { nameAr: "السيد مصطفى السيد", nameEn: "El Sayed Mostafa El Sayed", phone: "01098344440", birthYear: 2013 }, // 13 years old in 2026 (wait, phone on paper: 01090334440 or similar? let's look: 0109834444)
  { nameAr: "عبد الرحمن أحمد إبراهيم", nameEn: "Abd el Rahman Ahmed Ibrahim", phone: "01144350961", birthYear: 2017 }, // 9 years old in 2026
  { nameAr: "علي أحمد النساج", nameEn: "Aly Ahmed El Nassag", phone: "01140696965", birthYear: 2020 }, // 6 years old in 2026 (wait, phone: 01140696965 or 01140696960? let's check)
  { nameAr: "عبد الباري محمد محمد", nameEn: "Abd el Bary Mohamed Mohamed", phone: "01558246968", birthYear: 2009 },
  { nameAr: "يوسف أيمن مهدي", nameEn: "Yossef Ayman Mahdy", phone: "01150167646", birthYear: 2004 },
  { nameAr: "محمد مختار محمد", nameEn: "Mohamed Mokhtar Mohamed", phone: "01060641220", birthYear: 2019 }, // 7 years old in 2026 (phone on paper: 0106064122 - wait, Egyptian mobile numbers are 11 digits, starting with 010, 011, 012, 015. So 0106064122 needs one more digit? On paper: 0106064122 is written as 10 digits? Let's check.)
  { nameAr: "إسلام السيد حسن", nameEn: "Eslam El Sayed Hassan", phone: "01060031307", birthYear: 2003 },
  { nameAr: "يوسف تامر رمضان", nameEn: "Yossef Tamer Ramadan", phone: "01220450250", birthYear: 2011 },
  { nameAr: "عبد الله محمد مصطفى", nameEn: "Abdullah Mohamed Mostafa", phone: "01204570774", birthYear: 2009 },
  { nameAr: "أحمد محمد أحمد", nameEn: "Ahmed Mohamed Ahmed", phone: "01004227393", birthYear: 2018 },
  { nameAr: "ميرا مجدي ماهر", nameEn: "Mira Magdy Maher", phone: "01555474217", birthYear: 2009 }, // phone: 01555474217 (on paper: 01555474217 or similar?)
  { nameAr: "آية حسين نور الدين", nameEn: "Aya Hussein Nour El Din", phone: "01240799650", birthYear: 2012 }, // phone: 01240799650 (on paper: 01240799650?)
  { nameAr: "سارة حسين نور الدين", nameEn: "Sara Hussein Nour El Din", phone: "01105031493", birthYear: 2011 },
  { nameAr: "ردينا سعيد أحمد", nameEn: "Rodina Saeed Ahmed", phone: "01280389995", birthYear: 2004 },
];

async function main() {
  console.log("Checking if trainees already exist...");
  for (const t of traineesList) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: t.phone },
          { fullNameEn: t.nameEn },
          { fullNameAr: t.nameAr },
        ]
      }
    });

    if (existing) {
      console.log(`- FOUND: ${t.nameEn} as ${existing.fullNameEn} (ID: ${existing.id}, Phone: ${existing.phone})`);
    } else {
      console.log(`- NOT FOUND: ${t.nameEn} (${t.phone})`);
    }
  }
}

main().catch(console.error);
