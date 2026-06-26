"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecordMatchResultForm } from "@/components/championship/record-match-result-form";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string;
  championshipId: string;
  fighter1Id: string;
  fighter2Id: string;
  gender: string;
  fightClass: string;
  weightClass: string | null;
  winnerId: string | null;
  outcome: string | null;
  method: string | null;
  round: number | null;
  timeInRound: string | null;
  videoUrl: string | null;
  notes: string | null;
  fighter1: { registrationNumber: string | null; trainee: { fullNameEn: string; fullNameAr: string } };
  fighter2: { registrationNumber: string | null; trainee: { fullNameEn: string; fullNameAr: string } };
  winner: { trainee: { fullNameEn: string; fullNameAr: string } } | null;
}

export function RecordMatchResultRow({ matches }: { matches: Match[] }) {
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No matches matched/paired yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground font-semibold">
              <th className="py-2">Fighters</th>
              <th className="py-2">Class / Division</th>
              <th className="py-2">Weight</th>
              <th className="py-2">Result</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-b hover:bg-muted/10">
                <td className="py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {m.fighter1.trainee.fullNameEn} vs {m.fighter2.trainee.fullNameEn}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({m.fighter1.registrationNumber} vs {m.fighter2.registrationNumber})
                    </span>
                  </div>
                </td>
                <td className="py-3 uppercase text-xs font-bold">{m.fightClass}</td>
                <td className="py-3">{m.weightClass || "—"}</td>
                <td className="py-3">
                  {m.outcome ? (
                    <div className="flex flex-col">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-bold self-start">
                        {m.winner ? `WINNER: ${m.winner.trainee.fullNameEn}` : m.outcome}
                      </Badge>
                      {m.method && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          via {m.method} (R{m.round} @ {m.timeInRound || "—"})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs font-semibold">PENDING Bout</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveMatch(m)}
                    className="border-csk-gold text-csk-gold hover:bg-csk-gold/10"
                  >
                    Record Score
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-csk-gold/20 p-6 rounded-lg max-w-lg w-full space-y-4 relative text-white">
            <button
              onClick={() => setActiveMatch(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-csk-gold border-b border-muted pb-2">
              Record Bout Score & Details
            </h3>
            <p className="text-sm text-muted-foreground">
              Bout: {activeMatch.fighter1.trainee.fullNameEn} vs {activeMatch.fighter2.trainee.fullNameEn}
            </p>
            <RecordMatchResultForm match={activeMatch} onSuccess={() => setActiveMatch(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
