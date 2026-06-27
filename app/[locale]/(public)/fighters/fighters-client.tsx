"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";

interface SerializedFighter {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  profilePhotoUrl: string | null;
  gender: string | null;
  dob: string | null;
  homeAddress: string | null;
  homeLocationEn: string | null;
  homeLocationAr: string | null;
  latestWeightKg: number | null;
  latestFightClass: string | null;
  record: {
    wins: number;
    losses: number;
    draws: number;
    noContest: number;
  };
}

interface FightersClientProps {
  fighters: SerializedFighter[];
  locale: string;
}

export function FightersClient({ fighters, locale }: FightersClientProps) {
  const isRtl = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedWeight, setSelectedWeight] = useState("ALL");
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedAge, setSelectedAge] = useState("ALL");

  // Helper to parse country from address
  const getFighterCountry = (f: SerializedFighter) => {
    if (!f.homeAddress) return "Egypt";
    const addr = f.homeAddress.toLowerCase();
    if (addr.includes("jordan")) return "Jordan";
    if (addr.includes("saudi") || addr.includes("ksa")) return "Saudi Arabia";
    if (addr.includes("kuwait")) return "Kuwait";
    if (addr.includes("emirates") || addr.includes("uae") || addr.includes("dubai")) return "UAE";
    return "Egypt"; // default fallback
  };

  const getFighterAge = (dobStr: string | null) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const age = new Date().getFullYear() - dob.getFullYear();
    return age;
  };

  // Get unique countries in the dataset
  const countries = Array.from(
    new Set(fighters.map((f) => getFighterCountry(f)))
  ).filter(Boolean);

  // Filter fighters based on selections
  const filteredFighters = fighters.filter((f) => {
    // 1. Search Query
    const name = isRtl ? f.fullNameAr : f.fullNameEn;
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Country
    const country = getFighterCountry(f);
    if (selectedCountry !== "ALL" && country !== selectedCountry) {
      return false;
    }

    // 3. Gender
    if (selectedGender !== "ALL" && f.gender !== selectedGender) {
      return false;
    }

    // 4. Class (Amateur vs Semi-pro vs Pro)
    if (selectedClass !== "ALL" && f.latestFightClass !== selectedClass) {
      return false;
    }

    // 5. Weight
    if (selectedWeight !== "ALL") {
      const w = f.latestWeightKg;
      if (!w) return false;
      if (selectedWeight === "UNDER_50" && w >= 50) return false;
      if (selectedWeight === "50_60" && (w < 50 || w > 60)) return false;
      if (selectedWeight === "60_70" && (w < 60 || w > 70)) return false;
      if (selectedWeight === "70_80" && (w < 70 || w > 80)) return false;
      if (selectedWeight === "80_90" && (w < 80 || w > 90)) return false;
      if (selectedWeight === "OVER_90" && w <= 90) return false;
    }

    // 6. Age
    if (selectedAge !== "ALL") {
      const age = getFighterAge(f.dob);
      if (!age) return false;
      if (selectedAge === "UNDER_18" && age >= 18) return false;
      if (selectedAge === "18_25" && (age < 18 || age > 25)) return false;
      if (selectedAge === "26_35" && (age < 26 || age > 35)) return false;
      if (selectedAge === "OVER_35" && age <= 35) return false;
    }

    return true;
  });

  return (
    <div className="space-y-10">
      {/* Search & Filters Panel */}
      <div className="glass-card p-6 rounded-2xl border border-neutral-900 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "البحث عن مقاتل" : "Search Fighter"}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "اكتب اسم المقاتل..." : "Type fighter name..."}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          {/* Country Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "الدولة" : "Country"}
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            >
              <option value="ALL">{isRtl ? "جميع الدول" : "All Countries"}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === "Egypt" ? (isRtl ? "🇪🇬 مصر" : "🇪🇬 Egypt") : c}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "الجنس" : "Gender"}
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            >
              <option value="ALL">{isRtl ? "جميع الأجناس" : "All Genders"}</option>
              <option value="MALE">{isRtl ? "ذكر" : "Male"}</option>
              <option value="FEMALE">{isRtl ? "أنثى" : "Female"}</option>
            </select>
          </div>

          {/* Class (Amateur/Pro) Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "الفئة الرياضية" : "Class"}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            >
              <option value="ALL">{isRtl ? "جميع الفئات" : "All Classes"}</option>
              <option value="AMATEUR">{isRtl ? "هواة (Amateur)" : "Amateur"}</option>
              <option value="SEMI_PRO">{isRtl ? "شبه محترف (Semi-Pro)" : "Semi-Pro"}</option>
              <option value="PROFESSIONAL">{isRtl ? "محترف (Professional)" : "Professional"}</option>
            </select>
          </div>

          {/* Weight Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "الوزن" : "Weight Class"}
            </label>
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            >
              <option value="ALL">{isRtl ? "جميع الأوزان" : "All Weights"}</option>
              <option value="UNDER_50">{isRtl ? "تحت 50 كجم" : "Under 50 kg"}</option>
              <option value="50_60">50 – 60 kg</option>
              <option value="60_70">60 – 70 kg</option>
              <option value="70_80">70 – 80 kg</option>
              <option value="80_90">80 – 90 kg</option>
              <option value="OVER_90">{isRtl ? "فوق 90 كجم" : "Over 90 kg"}</option>
            </select>
          </div>

          {/* Age Filter */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {isRtl ? "العمر" : "Age"}
            </label>
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-csk-gold rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            >
              <option value="ALL">{isRtl ? "جميع الأعمار" : "All Ages"}</option>
              <option value="UNDER_18">{isRtl ? "تحت 18 سنة" : "Under 18"}</option>
              <option value="18_25">18 – 25</option>
              <option value="26_35">26 – 35</option>
              <option value="OVER_35">{isRtl ? "فوق 35 سنة" : "Over 35"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fighters Grid */}
      {filteredFighters.length === 0 ? (
        <Card className="border-neutral-800 bg-neutral-900/50 py-16 text-center text-neutral-400">
          <CardContent>
            <div className="text-4xl mb-4">⚔</div>
            <p>{isRtl ? "لم يتم العثور على مقاتلين يطابقون هذه الفلاتر." : "No fighters found matching these filters."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFighters.map((f) => {
            const country = getFighterCountry(f);
            const flag = country === "Egypt" ? "🇪🇬" : "🥋";
            const age = getFighterAge(f.dob);

            return (
              <div
                key={f.id}
                className="group relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/30 hover:bg-neutral-900/60 hover:border-csk-gold/30 transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Photo / Avatar */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-900 flex items-center justify-center mb-4">
                    {f.profilePhotoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={f.profilePhotoUrl}
                        alt={isRtl ? f.fullNameAr : f.fullNameEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl text-neutral-800">⚔</span>
                    )}
                    {f.latestFightClass && (
                      <span className="absolute bottom-2 left-2 bg-neutral-950/80 border border-neutral-800 text-csk-gold text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase">
                        {f.latestFightClass}
                      </span>
                    )}
                  </div>

                  {/* Name & Country */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                        {flag} {isRtl && country === "Egypt" ? "مصر" : country}
                      </span>
                      {age && (
                        <span className="text-xs text-neutral-400 font-medium">
                          {age} {isRtl ? "سنة" : "yrs"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-csk-gold uppercase tracking-tight transition-colors duration-200 truncate">
                      {isRtl ? f.fullNameAr : f.fullNameEn}
                    </h3>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-900/50 text-xs">
                    <div className="bg-neutral-950/50 p-2 rounded-lg text-center">
                      <span className="text-neutral-500 block uppercase font-bold text-[9px]">
                        {isRtl ? "الوزن" : "Weight"}
                      </span>
                      <span className="font-extrabold text-white font-mono">
                        {f.latestWeightKg ? `${f.latestWeightKg} kg` : "—"}
                      </span>
                    </div>
                    <div className="bg-neutral-950/50 p-2 rounded-lg text-center">
                      <span className="text-neutral-500 block uppercase font-bold text-[9px]">
                        {isRtl ? "السجل" : "Record"}
                      </span>
                      <span className="font-extrabold text-emerald-500 font-mono">
                        {f.record.wins}W <span className="text-rose-500">{f.record.losses}L</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href={`/champions/${f.id}`}
                    className="block text-center w-full py-2.5 rounded-xl text-xs font-black uppercase bg-neutral-900 text-neutral-300 hover:bg-csk-gold hover:text-csk-black transition-all duration-300 border border-neutral-800 hover:border-csk-gold"
                  >
                    {isRtl ? "عرض بطاقة الأداء" : "View Score Card"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
