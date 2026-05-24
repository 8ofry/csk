import { getLocale, getTranslations } from "next-intl/server";
import { publicScheduleByLocation } from "@/application/public/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScheduleJson {
  days?: string[];
  startTime?: string;
  endTime?: string;
}

const DAY_LABELS: Record<string, Record<string, string>> = {
  en: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
  ar: {
    mon: "الإثنين",
    tue: "الثلاثاء",
    wed: "الأربعاء",
    thu: "الخميس",
    fri: "الجمعة",
    sat: "السبت",
    sun: "الأحد",
  },
};

export default async function PublicSchedulePage() {
  const [t, locations, locale] = await Promise.all([
    getTranslations("publicSite.schedule"),
    publicScheduleByLocation(),
    getLocale(),
  ]);
  const dayLabel = DAY_LABELS[locale] ?? DAY_LABELS.en!;

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {locations.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-8">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <CardTitle>{loc.nameEn}</CardTitle>
                <p className="text-sm text-muted-foreground">{loc.district}</p>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {loc.groups.map((g) => {
                    const sched = (g.schedule as ScheduleJson | null) ?? {};
                    return (
                      <li key={g.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium">{g.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {g.discipline.nameEn} · {t("withCoach")}{" "}
                              {g.coaches.map((c) => c.coach.fullNameEn).join(" & ") || t("tbd")}
                            </div>
                          </div>
                          <Badge variant="outline">{g.discipline.category}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {(sched.days ?? []).map((d) => (
                              <span
                                key={d}
                                className="rounded-md bg-csk-gold/10 px-2 py-0.5 text-xs font-medium text-csk-gold"
                              >
                                {dayLabel[d] ?? d}
                              </span>
                            ))}
                          </div>
                          <span className="text-muted-foreground">
                            {sched.startTime} – {sched.endTime}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
