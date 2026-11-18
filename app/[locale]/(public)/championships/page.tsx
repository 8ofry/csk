import { prisma } from "@/infrastructure/db/prisma";
import { ChampionshipsList } from "./championships-list";

export default async function PublicChampionshipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  // Fetch championships & recent live match-day results
  const [championships, recentMatches] = await Promise.all([
    prisma.championship
      .findMany({
        include: {
          registrations: {
            where: { status: { in: ["COACH_CONFIRMED", "PAID", "PENDING_VERIFICATION"] } },
          },
        },
        orderBy: { startDate: "desc" },
      })
      .catch(() => []),
    prisma.match
      .findMany({
        where: { outcome: { not: null } },
        include: {
          championship: { select: { name: true } },
          fighter1: { select: { trainee: { select: { fullNameEn: true, fullNameAr: true } } } },
          fighter2: { select: { trainee: { select: { fullNameEn: true, fullNameAr: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
      .catch(() => []),
  ]);

  // Serialize championships for client component
  const serializedChampionships = championships.map((c) => ({
    id: c.id,
    name: c.name,
    organizer: c.organizer,
    locationLabel: c.locationLabel,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    registrationFee: c.registrationFee.toString(),
    registrationsCount: c.registrations.length,
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-csk-gold/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-csk-gold/5 blur-[120px]" />

      <div className="container max-w-6xl px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-csk-gold via-white to-csk-gold bg-clip-text text-transparent">
            {isRtl ? "البطولات والفعاليات" : "CHAMPIONSHIPS & EVENTS"}
          </h1>
          <div className="section-divider" />
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            {isRtl
              ? "استكشف بطولات CSK الرسمية والمفتوحة. نزالات قوية تجمع نخبة المقاتلين."
              : "Discover official CSK tournaments. Witness elite fighters compete in accredited bouts."}
          </p>
        </div>

        {/* Championships List with Filter Tabs */}
        <ChampionshipsList championships={serializedChampionships} locale={locale} />

        {recentMatches.length > 0 && (
          <div className="mt-16 space-y-4">
            <h2 className="text-2xl font-bold text-csk-gold">
              {isRtl ? "نتائج النزالات الأخيرة" : "Recent Match-Day Results"}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm space-y-1"
                >
                  <div className="text-xs text-csk-gold">{m.championship.name}</div>
                  <div className="font-semibold">
                    {isRtl ? m.fighter1.trainee.fullNameAr : m.fighter1.trainee.fullNameEn}{" "}
                    <span className="text-white/40">vs</span>{" "}
                    {isRtl ? m.fighter2.trainee.fullNameAr : m.fighter2.trainee.fullNameEn}
                  </div>
                  <div className="text-xs text-white/60">
                    {m.outcome} {m.method ? `· ${m.method}` : ""}{" "}
                    {m.round ? `· R${m.round}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
