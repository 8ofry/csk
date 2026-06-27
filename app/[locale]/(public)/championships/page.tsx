import { prisma } from "@/infrastructure/db/prisma";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

export default async function PublicChampionshipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const now = new Date();

  // Fetch championships
  const championships = await prisma.championship.findMany({
    include: {
      registrations: {
        where: { status: { in: ["COACH_CONFIRMED", "PAID", "PENDING_VERIFICATION"] } },
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Group events
  const ongoing = championships.filter((c) => c.startDate <= now && c.endDate >= now);
  const upcoming = championships.filter((c) => c.startDate > now);
  const past = championships.filter((c) => c.endDate < now);

  const formatEventDate = (start: Date, end: Date) => {
    return `${start.toLocaleDateString(locale)} – ${end.toLocaleDateString(locale)}`;
  };

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

        {/* ONGOING EVENTS */}
        {ongoing.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold uppercase tracking-wider text-csk-gold mb-6 border-b border-neutral-900 pb-2">
              🔴 {isRtl ? "البطولات الجارية حالياً" : "Ongoing Tournaments"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoing.map((c) => (
                <div
                  key={c.id}
                  className="glass-card p-6 flex flex-col justify-between hover:border-csk-gold/30 transition-all duration-300 rounded-xl"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-rose-600 text-white border-none font-bold uppercase text-[10px] tracking-wider animate-pulse">
                        {isRtl ? "جارية حالياً" : "LIVE NOW"}
                      </Badge>
                      <span className="text-xs text-neutral-500 font-mono">
                        {c.registrations.length} {isRtl ? "مسجل" : "Registered"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white group-hover:text-csk-gold uppercase tracking-tight">
                        {c.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        {isRtl ? `بواسطة ${c.organizer}` : `Organized by ${c.organizer}`}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-300">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{c.locationLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatEventDate(c.startDate, c.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⚖</span>
                        <span>{isRtl ? `رسوم التسجيل: ${Number(c.registrationFee).toFixed(2)} جنيه` : `Fee: ${Number(c.registrationFee).toFixed(2)} EGP`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/championships/register?id=${c.id}`}
                      className="flex-1 text-center py-2.5 rounded-full text-xs font-black uppercase bg-csk-gold text-csk-black hover:bg-csk-goldLight transition-all"
                    >
                      {isRtl ? "سجل كمقاتل فردي" : "Register Individually"}
                    </Link>
                    <Link
                      href="/championship/signup"
                      className="flex-1 text-center py-2.5 rounded-full text-xs font-black uppercase border border-neutral-800 text-neutral-300 hover:bg-white/5 transition-all"
                    >
                      {isRtl ? "تسجيل أكاديمية (جملة)" : "Academy Bulk Submission"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* UPCOMING EVENTS */}
        <section className="mb-12">
          <h2 className="text-xl font-bold uppercase tracking-wider text-csk-gold mb-6 border-b border-neutral-900 pb-2">
            🏆 {isRtl ? "البطولات القادمة" : "Upcoming Tournaments"}
          </h2>
          {upcoming.length === 0 ? (
            <div className="glass-card py-12 text-center text-neutral-500 rounded-xl">
              <p className="text-sm">{isRtl ? "لا توجد بطولات قادمة مجدولة حالياً." : "No upcoming tournaments scheduled yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((c) => (
                <div
                  key={c.id}
                  className="glass-card p-6 flex flex-col justify-between hover:border-csk-gold/30 transition-all duration-300 rounded-xl"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-csk-gold/10 text-csk-gold border border-csk-gold/20 font-bold uppercase text-[10px] tracking-wider">
                        {isRtl ? "مفتوح للتسجيل" : "UPCOMING"}
                      </Badge>
                      <span className="text-xs text-neutral-500 font-mono">
                        {c.registrations.length} {isRtl ? "مسجل" : "Registered"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white group-hover:text-csk-gold uppercase tracking-tight">
                        {c.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        {isRtl ? `بواسطة ${c.organizer}` : `Organized by ${c.organizer}`}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-neutral-300">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{c.locationLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatEventDate(c.startDate, c.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⚖</span>
                        <span>{isRtl ? `رسوم التسجيل: ${Number(c.registrationFee).toFixed(2)} جنيه` : `Fee: ${Number(c.registrationFee).toFixed(2)} EGP`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/championships/register?id=${c.id}`}
                      className="flex-1 text-center py-2.5 rounded-full text-xs font-black uppercase bg-csk-gold text-csk-black hover:bg-csk-goldLight transition-all"
                    >
                      {isRtl ? "سجل كمقاتل فردي" : "Register Individually"}
                    </Link>
                    <Link
                      href="/championship/signup"
                      className="flex-1 text-center py-2.5 rounded-full text-xs font-black uppercase border border-neutral-800 text-neutral-300 hover:bg-white/5 transition-all"
                    >
                      {isRtl ? "تسجيل أكاديمية (جملة)" : "Academy Bulk Submission"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PAST EVENTS */}
        {past.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-500 mb-6 border-b border-neutral-900 pb-2">
              📜 {isRtl ? "البطولات السابقة" : "Past Tournaments"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {past.map((c) => (
                <div
                  key={c.id}
                  className="border border-neutral-900 bg-neutral-900/10 p-5 flex flex-col justify-between rounded-xl opacity-70 hover:opacity-100 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="border-neutral-800 text-neutral-500 font-bold uppercase text-[9px] tracking-wider">
                        {isRtl ? "منتهية" : "COMPLETED"}
                      </Badge>
                      <span className="text-xs text-neutral-500 font-mono">
                        {c.registrations.length} {isRtl ? "مسجل" : "Registered"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-neutral-300 uppercase tracking-tight">
                        {c.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {isRtl ? `بواسطة ${c.organizer}` : `Organized by ${c.organizer}`}
                      </p>
                    </div>
                    <div className="space-y-1 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{c.locationLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{formatEventDate(c.startDate, c.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-900">
                    <Link
                      href="/champions"
                      className="block text-center py-2 rounded-lg text-xs font-bold uppercase border border-neutral-800 text-neutral-400 hover:text-csk-gold hover:border-csk-gold/20 transition-all"
                    >
                      {isRtl ? "عرض نتائج المقاتلين" : "View Fighter Standings"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
