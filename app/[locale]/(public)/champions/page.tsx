import { getTranslations } from "next-intl/server";
import { listPublicChampions } from "@/application/public/service";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChampionShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, champions] = await Promise.all([
    getTranslations("publicSite.champions"),
    listPublicChampions(),
  ]);

  const isRtl = locale === "ar";

  // Sort and assign rankings
  const rankedChampions = champions.map((c, index) => {
    // Generate a points score based on wins, draws, and losses
    const points = c.record.wins * 50 + (c.record.draws || 0) * 25 + (c.record.losses || 0) * 5 + 500;
    return {
      ...c,
      rank: index + 1,
      points,
    };
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-12">
      <div className="container max-w-5xl px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-csk-gold via-white to-csk-gold bg-clip-text text-transparent">
            {isRtl ? "تصنيفات المقاتلين" : "P4P RANKINGS"}
          </h1>
          <p className="mt-3 text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            {isRtl
              ? "تصنيفات أفضل مقاتلي الأكاديمية بناءً على نتائج مبارياتهم الرسمية وسجل القتال."
              : "Official pound-for-pound rankings of CSK fighters based on official tournament bouts."}
          </p>
        </div>

        {champions.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900/50 py-16 text-center text-neutral-400">
            <CardContent>
              <div className="text-4xl mb-4">⚔</div>
              <p>{t("empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Table Header for Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-900">
              <div className="col-span-1 text-center">{isRtl ? "الترتيب" : "Rank"}</div>
              <div className="col-span-5">{isRtl ? "المقاتل" : "Fighter"}</div>
              <div className="col-span-2 text-center">{isRtl ? "الموقع" : "Location"}</div>
              <div className="col-span-2 text-center">{isRtl ? "الفئة" : "Division"}</div>
              <div className="col-span-1 text-center">{isRtl ? "السجل" : "Record"}</div>
              <div className="col-span-1 text-end">{isRtl ? "النقاط" : "Points"}</div>
            </div>

            {/* Rankings List */}
            <div className="space-y-3">
              {rankedChampions.map((c) => {
                // Rank Styling
                let rankBadgeBg = "bg-neutral-800 text-neutral-400";
                let rankBadgeBorder = "border-neutral-700";
                let rankColor = "text-neutral-400";
                
                if (c.rank === 1) {
                  rankBadgeBg = "bg-gradient-to-br from-yellow-400 to-amber-600 text-black font-black";
                  rankBadgeBorder = "border-yellow-400/50";
                  rankColor = "text-yellow-400";
                } else if (c.rank === 2) {
                  rankBadgeBg = "bg-gradient-to-br from-slate-300 to-slate-500 text-black font-black";
                  rankBadgeBorder = "border-slate-300/30";
                  rankColor = "text-slate-300";
                } else if (c.rank === 3) {
                  rankBadgeBg = "bg-gradient-to-br from-amber-600 to-amber-900 text-white font-black";
                  rankBadgeBorder = "border-amber-700/20";
                  rankColor = "text-amber-600";
                }

                return (
                  <Link
                    key={c.id}
                    href={`/champions/${c.id}` as Parameters<typeof Link>[0]["href"]}
                    className="block group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-csk-gold transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl border border-neutral-900 bg-neutral-900/30 group-hover:bg-neutral-900/60 group-hover:border-csk-gold/30 transition-all duration-200 shadow-md">
                      {/* Rank & Photo */}
                      <div className="col-span-1 md:col-span-1 flex items-center justify-between md:justify-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${rankBadgeBg} ${rankBadgeBorder}`}>
                          {c.rank}
                        </div>
                        <span className="md:hidden text-xs font-bold text-neutral-500 uppercase">
                          {isRtl ? "الترتيب" : "Rank"}
                        </span>
                      </div>

                      {/* Fighter Info */}
                      <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                        {c.profilePhotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={c.profilePhotoUrl}
                            alt={c.fullNameEn}
                            className="h-12 w-12 rounded-full object-cover border-2 border-neutral-800 group-hover:border-csk-gold transition-colors duration-200"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-lg border border-neutral-700 text-csk-gold">
                            ⚔
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-white group-hover:text-csk-gold transition-colors duration-200 text-base sm:text-lg">
                            {isRtl ? c.fullNameAr : c.fullNameEn}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {isRtl ? c.fullNameEn : c.fullNameAr}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm text-neutral-300">
                        <span className="md:hidden text-xs font-bold text-neutral-500 uppercase">
                          {isRtl ? "الموقع" : "Location"}
                        </span>
                        <span>{isRtl ? c.homeLocationAr || "—" : c.homeLocationEn || "—"}</span>
                      </div>

                      {/* Fight Class / Division */}
                      <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm">
                        <span className="md:hidden text-xs font-bold text-neutral-500 uppercase">
                          {isRtl ? "الفئة" : "Division"}
                        </span>
                        <Badge variant="outline" className="border-neutral-800 text-neutral-300 capitalize">
                          {c.latestFightClass?.replace("_", " ").toLowerCase() || "—"}
                          {c.latestWeightKg ? ` (${c.latestWeightKg} kg)` : ""}
                        </Badge>
                      </div>

                      {/* Record */}
                      <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-mono">
                        <span className="md:hidden text-xs font-bold text-neutral-500 uppercase">
                          {isRtl ? "السجل" : "Record"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-500 font-bold">{c.record.wins}</span>
                          <span className="text-neutral-600">-</span>
                          <span className="text-rose-500 font-bold">{c.record.losses}</span>
                          {c.record.draws > 0 && (
                            <>
                              <span className="text-neutral-600">-</span>
                              <span className="text-amber-500 font-bold">{c.record.draws}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="col-span-1 md:col-span-1 flex justify-between md:justify-end items-center font-mono">
                        <span className="md:hidden text-xs font-bold text-neutral-500 uppercase">
                          {isRtl ? "النقاط" : "Points"}
                        </span>
                        <span className={`font-bold ${rankColor}`}>
                          {c.points} <span className="text-[10px] text-neutral-500">PTS</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
