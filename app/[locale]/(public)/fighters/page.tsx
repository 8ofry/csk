import { listPublicFighters } from "@/application/public/service";
import { FightersClient } from "./fighters-client";

export default async function FightersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  // Fetch all public fighters registered in championships
  const fighters = await listPublicFighters();

  // Serialize the decimal weight and other fields to simple JS types
  const serializedFighters = fighters.map((f) => ({
    id: f.id,
    fullNameEn: f.fullNameEn,
    fullNameAr: f.fullNameAr,
    profilePhotoUrl: f.profilePhotoUrl,
    gender: f.gender,
    dob: f.dob ? f.dob.toISOString() : null,
    homeAddress: f.homeAddress,
    homeLocationEn: f.homeLocationEn,
    homeLocationAr: f.homeLocationAr,
    latestWeightKg: f.latestWeightKg,
    latestFightClass: f.latestFightClass,
    record: {
      wins: f.record.wins,
      losses: f.record.losses,
      draws: f.record.draws,
      noContest: f.record.noContest,
    },
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-csk-gold/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-csk-gold/5 blur-[120px]" />

      <div className="container max-w-6xl px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-csk-gold via-white to-csk-gold bg-clip-text text-transparent animate-fade-in">
            {isRtl ? "مقاتلي الأكاديمية" : "CSK FIGHTERS & ATHLETES"}
          </h1>
          <div className="section-divider" />
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            {isRtl
              ? "تعرّف على نخبة مقاتلي CSK في الملاكمة، الكيك بوكسينغ، والفنون القتالية المختلطة."
              : "Meet the elite fighters representing CSK in boxing, kickboxing, and MMA."}
          </p>
        </div>

        {/* Client side filtered listing */}
        <FightersClient fighters={serializedFighters} locale={locale} />
      </div>
    </div>
  );
}
