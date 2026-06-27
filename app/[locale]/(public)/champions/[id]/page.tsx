import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getPublicFighterProfile } from "@/application/public/fighter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchVideoPlayer } from "@/components/public/match-video-player";

export default async function FighterProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const fighter = await getPublicFighterProfile(id);
  if (!fighter) notFound();

  const isRtl = locale === "ar";

  // Determine latest weight class from fights
  const latestWeight = fighter.fights[0]?.weightKg ?? null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-12">
      <div className="container max-w-5xl px-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/fighters" className="text-sm font-semibold text-csk-gold hover:text-csk-goldLight transition-colors flex items-center gap-1">
            {isRtl ? "← العودة إلى قائمة المقاتلين" : "← Back to Fighters List"}
          </Link>
        </div>

        {/* Kickboxhub-style Hero Profile Card */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          {/* Points Badge */}
          <div className="absolute right-6 top-6 md:right-8 md:top-8">
            <span className="rounded-lg border border-csk-gold/30 bg-csk-gold/10 px-3 py-1.5 font-mono text-xs font-bold text-csk-gold">
              {fighter.points} {isRtl ? "نقطة" : "PTS"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
            {/* Fighter Image */}
            <div className="relative shrink-0">
              {fighter.profilePhotoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={fighter.profilePhotoUrl}
                  alt={fighter.fullNameEn}
                  className="h-32 w-32 md:h-36 md:w-36 rounded-2xl border-2 border-csk-gold object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-32 w-32 md:h-36 md:w-36 items-center justify-center rounded-2xl border-2 border-csk-gold bg-neutral-950 text-5xl text-csk-gold shadow-lg">
                  ⚔
                </div>
              )}
            </div>

            {/* Fighter Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase truncate">
                  {isRtl ? fighter.fullNameAr : fighter.fullNameEn}
                </h1>
                <p className="text-neutral-400 text-sm italic font-medium">
                  &quot;{isRtl ? fighter.fullNameEn : fighter.fullNameAr}&quot;
                </p>
              </div>

              {/* Stats & Meta info */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs md:text-sm text-neutral-300">
                {fighter.homeLocationName && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500">📍</span>
                    <span>{fighter.homeLocationName}</span>
                  </div>
                )}
                {fighter.gender && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500">🥋</span>
                    <span className="uppercase">{isRtl && fighter.gender === "MALE" ? "ذكر" : isRtl && fighter.gender === "FEMALE" ? "أنثى" : fighter.gender}</span>
                  </div>
                )}
                {latestWeight && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500">⚖</span>
                    <span>{latestWeight} kg</span>
                  </div>
                )}
                {fighter.age && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500">📅</span>
                    <span>{fighter.age} {isRtl ? "سنة" : "yrs"}</span>
                  </div>
                )}
              </div>

              {/* Record Summary */}
              <div className="flex items-baseline gap-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-emerald-500">{fighter.record.wins}</span>
                  <span className="text-xs uppercase tracking-widest text-neutral-500">{isRtl ? "فوز" : "WINS"}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-rose-500">{fighter.record.losses}</span>
                  <span className="text-xs uppercase tracking-widest text-neutral-500">{isRtl ? "خسارة" : "LOSSES"}</span>
                </div>
                {fighter.record.draws > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-amber-500">{fighter.record.draws}</span>
                    <span className="text-xs uppercase tracking-widest text-neutral-500">{isRtl ? "تعادل" : "DRAWS"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Win Rate & Last 6 Bouts */}
            <div className="w-full md:w-64 space-y-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-800 md:pl-8">
              {/* Win Rate */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">{isRtl ? "نسبة الفوز" : "Win Rate"}</span>
                  <span className="text-csk-gold font-bold">{fighter.winRate}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-csk-gold rounded-full" style={{ width: `${fighter.winRate}%` }} />
                </div>
              </div>

              {/* Wins by KO */}
              {fighter.winsByKO > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{isRtl ? "الفوز بالقاضية" : "Wins by KO/TKO"}</span>
                  <Badge variant="outline" className="border-csk-gold/30 text-csk-gold font-bold font-mono">
                    {fighter.winsByKO}
                  </Badge>
                </div>
              )}

              {/* Last 6 Bouts */}
              {fighter.last6.length > 0 && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1.5">
                    {isRtl ? "آخر 6 نزالات" : "Last 6 Bouts"}
                  </div>
                  <div className="flex gap-1.5">
                    {fighter.last6.map((result, idx) => (
                      <span
                        key={idx}
                        className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold font-mono ${
                          result === "W"
                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                            : result === "L"
                            ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Method Breakdown & Belt Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Method breakdown */}
          {fighter.record.methods.length > 0 && (
            <Card className="border-neutral-900 bg-neutral-900/20 text-white">
              <CardHeader className="border-b border-neutral-900 pb-3">
                <CardTitle className="text-lg font-bold text-csk-gold">{isRtl ? "تفاصيل الفوز" : "Method Breakdown"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {fighter.record.methods.map((m) => (
                    <Badge key={m.method} variant="secondary" className="bg-neutral-900 text-neutral-200 border border-neutral-800 px-3 py-1 text-xs">
                      {m.method}: <span className="text-csk-gold font-bold ml-1">{m.count}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Belt levels */}
          {fighter.beltLevels.length > 0 && (
            <Card className="border-neutral-900 bg-neutral-900/20 text-white">
              <CardHeader className="border-b border-neutral-900 pb-3">
                <CardTitle className="text-lg font-bold text-csk-gold">{isRtl ? "مستويات الحزام" : "Belt Levels"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="grid grid-cols-2 gap-3">
                  {fighter.beltLevels.map((b) => (
                    <li key={b.discipline} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-2.5 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{b.discipline}</div>
                      <div className="mt-0.5 text-xl font-black text-csk-gold">{b.level}</div>
                      <div className="text-[9px] text-neutral-500">{b.achievedAt}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fight history section (Kickboxhub Style) */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>🥊</span> {isRtl ? "سجل النزالات" : "Fight History"}
            <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
              {fighter.fights.length} {isRtl ? "نزالات" : "bouts"}
            </span>
          </h2>

          {fighter.fights.length === 0 ? (
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/20 p-8 text-center text-neutral-500 text-sm">
              {isRtl ? "لا توجد نزالات مسجلة حتى الآن." : "No recorded fights yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {fighter.fights.map((f, idx) => {
                const isWinner = f.outcome === "WIN";
                
                return (
                  <div key={idx} className="rounded-xl border border-neutral-900 bg-neutral-900/20 overflow-hidden">
                    {/* Event header info */}
                    <div className="bg-neutral-950/60 px-4 py-2 border-b border-neutral-900 flex justify-between items-center text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-300">{f.championshipName}</span>
                        <span>·</span>
                        <span>{f.championshipDate}</span>
                      </div>
                      {f.isOfficial && (
                        <span className="bg-csk-gold/10 text-csk-gold border border-csk-gold/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                          {isRtl ? "رسمي" : "OFFICIAL"}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Matchup row */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {/* Fighter 1 (Our Trainee) */}
                        <div className={`w-full sm:w-5/12 flex items-center justify-between sm:justify-end gap-3 px-4 py-2.5 rounded-lg border ${
                          isWinner 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-white" 
                            : "bg-neutral-900/50 border-neutral-800 text-neutral-300"
                        }`}>
                          <span className="font-extrabold sm:order-1 text-sm sm:text-base">
                            {isRtl ? fighter.fullNameAr : fighter.fullNameEn}
                          </span>
                          <span className={`h-6 w-6 shrink-0 rounded flex items-center justify-center text-xs font-black font-mono sm:order-2 ${
                            isWinner ? "bg-emerald-500 text-black" : "bg-neutral-800 text-neutral-500"
                          }`}>
                            {isWinner ? "W" : "L"}
                          </span>
                        </div>

                        {/* VS bubble */}
                        <div className="shrink-0 flex items-center justify-center">
                          <span className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-black text-csk-gold font-mono">
                            VS
                          </span>
                        </div>

                        {/* Fighter 2 (Opponent) */}
                        <div className={`w-full sm:w-5/12 flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 rounded-lg border ${
                          !isWinner 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-white" 
                            : "bg-neutral-900/50 border-neutral-800 text-neutral-300"
                        }`}>
                          <span className={`h-6 w-6 shrink-0 rounded flex items-center justify-center text-xs font-black font-mono ${
                            !isWinner ? "bg-emerald-500 text-black" : "bg-neutral-800 text-neutral-500"
                          }`}>
                            {!isWinner ? "W" : "L"}
                          </span>
                          <span className="font-extrabold text-sm sm:text-base">
                            {f.opponentName}
                          </span>
                        </div>
                      </div>

                      {/* Decision Details underneath */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-neutral-400">
                        <div className="flex flex-wrap items-center gap-2">
                          {f.level && <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-semibold">{f.level}</span>}
                          {f.weightKg && <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-semibold">{f.weightKg} kg</span>}
                          {f.method && (
                            <span className="text-csk-gold font-bold uppercase">
                              {f.method} {f.round ? `R${f.round}` : ""} {f.timeInRound ? `(${f.timeInRound})` : ""}
                            </span>
                          )}
                        </div>

                        {/* Video Player */}
                        {f.videoUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">📺</span>
                            <MatchVideoPlayer videoUrl={f.videoUrl} opponentName={f.opponentName} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Championships participated in */}
        {fighter.championships.length > 0 && (
          <Card className="border-neutral-900 bg-neutral-900/20 text-white">
            <CardHeader className="border-b border-neutral-900 pb-3">
              <CardTitle className="text-lg font-bold text-csk-gold">
                {isRtl ? "البطولات المشارك بها" : `Championships (${fighter.championships.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-neutral-300">
                  <thead className="text-xs uppercase bg-neutral-950/60 text-neutral-400 border-b border-neutral-900">
                    <tr>
                      <th className="px-6 py-3">{isRtl ? "البطولة" : "Championship"}</th>
                      <th className="px-6 py-3">{isRtl ? "التاريخ" : "Date"}</th>
                      <th className="px-6 py-3 text-center">{isRtl ? "الوزن" : "Weight"}</th>
                      <th className="px-6 py-3 text-center">{isRtl ? "الفئة" : "Class"}</th>
                      <th className="px-6 py-3 text-center">{isRtl ? "النزالات" : "Bouts"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {fighter.championships.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-900/30">
                        <td className="px-6 py-4 font-semibold text-white">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{c.startDate}</td>
                        <td className="px-6 py-4 text-center">{c.weightKg ? `${c.weightKg} kg` : "—"}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="border-neutral-800 text-neutral-400 capitalize">
                            {c.level?.replace("_", " ").toLowerCase() || "—"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-csk-gold">{c.fightCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
