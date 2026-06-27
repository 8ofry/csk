"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

interface SerializedChampionship {
  id: string;
  name: string;
  organizer: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  registrationFee: string;
  registrationsCount: number;
}

interface ChampionshipsListProps {
  championships: SerializedChampionship[];
  locale: string;
}

export function ChampionshipsList({ championships, locale }: ChampionshipsListProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "ONGOING" | "UPCOMING" | "PAST">("ALL");
  const isRtl = locale === "ar";
  const now = new Date();

  // Filter logic
  const filtered = championships.filter((c) => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);

    if (activeTab === "ONGOING") {
      return start <= now && end >= now;
    }
    if (activeTab === "UPCOMING") {
      return start > now;
    }
    if (activeTab === "PAST") {
      return end < now;
    }
    return true; // ALL
  });

  const formatEventDate = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleDateString(locale)} – ${end.toLocaleDateString(locale)}`;
  };

  const getStatusBadge = (c: SerializedChampionship) => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);

    if (start <= now && end >= now) {
      return (
        <Badge className="bg-rose-600 text-white border-none font-bold uppercase text-[10px] tracking-wider animate-pulse">
          {isRtl ? "جارية حالياً" : "LIVE NOW"}
        </Badge>
      );
    } else if (start > now) {
      return (
        <Badge className="bg-csk-gold/10 text-csk-gold border border-csk-gold/20 font-bold uppercase text-[10px] tracking-wider">
          {isRtl ? "مفتوح للتسجيل" : "UPCOMING"}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-neutral-800 text-neutral-500 font-bold uppercase text-[9px] tracking-wider">
          {isRtl ? "منتهية" : "COMPLETED"}
        </Badge>
      );
    }
  };

  const tabs = [
    { id: "ALL", labelEn: "All Events", labelAr: "كل الفعاليات" },
    { id: "ONGOING", labelEn: "Ongoing", labelAr: "الجارية حالياً" },
    { id: "UPCOMING", labelEn: "Upcoming", labelAr: "البطولات القادمة" },
    { id: "PAST", labelEn: "Past / Closed", labelAr: "البطولات السابقة" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Tabs list with premium design */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-neutral-900 pb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "bg-csk-gold text-csk-black shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-105"
                  : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
              }`}
            >
              {isRtl ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="glass-card py-16 text-center text-neutral-500 rounded-xl">
          <p className="text-sm">
            {isRtl
              ? "لا توجد بطولات تطابق التبويب المختار."
              : "No tournaments found matching the selected filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filtered.map((c) => {
            const end = new Date(c.endDate);
            const isPast = end < now;

            return (
              <div
                key={c.id}
                className={`glass-card p-6 flex flex-col justify-between hover:border-csk-gold/30 transition-all duration-300 rounded-xl ${
                  isPast ? "opacity-75 hover:opacity-100 border-neutral-900 bg-neutral-900/10" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    {getStatusBadge(c)}
                    <span className="text-xs text-neutral-500 font-mono">
                      {c.registrationsCount} {isRtl ? "مسجل" : "Registered"}
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
                      <span>
                        {isRtl
                          ? `رسوم التسجيل: ${Number(c.registrationFee).toFixed(2)} جنيه`
                          : `Fee: ${Number(c.registrationFee).toFixed(2)} EGP`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3">
                  {!isPast ? (
                    <>
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
                    </>
                  ) : (
                    <Link
                      href="/champions"
                      className="w-full text-center py-2.5 rounded-full text-xs font-black uppercase border border-neutral-800 text-neutral-400 hover:text-csk-gold hover:border-csk-gold/20 transition-all"
                    >
                      {isRtl ? "عرض نتائج المقاتلين" : "View Fighter Standings"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
