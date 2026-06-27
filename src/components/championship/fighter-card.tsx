"use client";

import { useTranslations } from "next-intl";

interface FighterCardProps {
  fighter: {
    fullNameEn: string;
    fullNameAr: string;
    gender?: string | null;
    dob?: Date | string | null;
    photoUrl?: string | null;
  };
  registration: {
    registrationNumber?: string | null;
    fightClass?: string | null;
    weightKg?: number | string | { toString(): string } | null;
  };
  academyName: string;
}

export function FighterCard({ fighter, registration, academyName }: FighterCardProps) {
  const t = useTranslations("coachChampionships");
  const dobStr = fighter.dob ? new Date(fighter.dob).toLocaleDateString() : "—";

  const handlePrint = () => {
    const printContent = document.getElementById(`fighter-card-${registration.registrationNumber}`);
    if (!printContent) return;
    const windowUrl = "about:blank";
    const uniqueName = new Date().getTime().toString();
    const printWindow = window.open(windowUrl, uniqueName, "left=50,top=50,width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>CSK ID Card - ${fighter.fullNameEn}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { background-color: #f3f4f6; padding: 2rem; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .print-card {
              border: 4px solid #d4af37;
              background: linear-gradient(135deg, #0a0a0a 0%, #171717 100%);
              color: white;
              padding: 1.5rem;
              border-radius: 0.75rem;
              width: 320px;
              height: 480px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .text-gold { color: #d4af37; }
            @media print {
              body { background-color: white; padding: 0; display: block; }
              .no-print { display: none; }
              .print-card { box-shadow: none; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Visual Card Representation */}
      <div
        id={`fighter-card-${registration.registrationNumber || "temp"}`}
        className="relative border-4 bg-gradient-to-br from-neutral-950 to-neutral-900 text-white p-6 rounded-xl shadow-2xl w-80 h-[480px] flex flex-col justify-between border-csk-gold overflow-hidden select-none"
      >
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-csk-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-csk-gold/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex justify-between items-start border-b border-csk-gold/20 pb-4">
          <div className="flex flex-col">
            <span className="text-csk-gold font-bold text-lg tracking-wider">CSK CHAMPIONSHIP</span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Official Fighter Card</span>
          </div>
          <img
            src="/images/logo.png"
            alt="CSK Logo"
            className="h-8 object-contain filter brightness-125"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Card Body */}
        <div className="flex gap-4 my-auto">
          {/* Fighter Photo */}
          <div className="w-24 h-32 rounded-lg border border-csk-gold/30 bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
            {fighter.photoUrl ? (
              <img src={fighter.photoUrl} alt={fighter.fullNameEn} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-12 h-12 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>

          {/* Fighter Info */}
          <div className="flex flex-col justify-center gap-1.5 text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Fighter Name</div>
              <div className="font-semibold text-white">{fighter.fullNameEn}</div>
              <div className="font-semibold text-white/90" dir="rtl">{fighter.fullNameAr}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Class / Division</div>
              <div className="font-bold text-csk-gold uppercase">{registration.fightClass || "—"}</div>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Weight</div>
                <div className="font-semibold">{registration.weightKg?.toString() || "—"} kg</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Gender</div>
                <div className="font-semibold uppercase">{fighter.gender || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="border-t border-csk-gold/20 pt-4 flex flex-col gap-1 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>REG ID: <strong className="text-white font-mono">{registration.registrationNumber || "—"}</strong></span>
            <span>DOB: <strong className="text-white">{dobStr}</strong></span>
          </div>
          <div className="flex justify-between">
            <span>ACADEMY: <strong className="text-csk-gold uppercase">{academyName}</strong></span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="w-full px-4 py-2 bg-csk-gold text-csk-black font-semibold rounded hover:bg-csk-goldLight transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {t("downloadCard")}
      </button>
    </div>
  );
}
