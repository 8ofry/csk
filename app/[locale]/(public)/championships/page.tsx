import { prisma } from "@/infrastructure/db/prisma";
import { ChampionshipsList } from "./championships-list";

export default async function PublicChampionshipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  // Fetch championships
  const championships = await prisma.championship.findMany({
    include: {
      registrations: {
        where: { status: { in: ["COACH_CONFIRMED", "PAID", "PENDING_VERIFICATION"] } },
      },
    },
    orderBy: { startDate: "desc" },
  });

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
      </div>
    </div>
  );
}
