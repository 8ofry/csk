"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceRoster, type RosterTrainee } from "./attendance-roster";
import { QuickEvalGrid } from "./quick-eval-grid";
import type { AttendanceMark } from "@/application/attendance/service";

interface QuickEvalItem {
  traineeId: string;
  effortScore: number;
  notes: string | null;
  flaggedBodyPart: string | null;
  flaggedSkill: string | null;
}

export function SessionInteractionPanel({
  sessionId,
  groupTrainees,
  allSystemTrainees,
  initialQuickEvals,
  svgContent,
}: {
  sessionId: string;
  groupTrainees: RosterTrainee[];
  allSystemTrainees: { id: string; fullNameEn: string; fullNameAr: string }[];
  initialQuickEvals: QuickEvalItem[];
  svgContent?: string;
}) {
  const t = useTranslations("session");
  const locale = useLocale();

  // State to track all trainees in the active attendance roster
  const [roster, setRoster] = useState<RosterTrainee[]>(groupTrainees);

  // State to track real-time attendance marks
  const [marks, setMarks] = useState<Record<string, AttendanceMark | undefined>>(
    Object.fromEntries(groupTrainees.map((tr) => [tr.id, tr.current]))
  );

  // Compute who is currently marked as attended (PRESENT or LATE)
  const attendedTrainees = roster.filter(
    (tr) => marks[tr.id] === "PRESENT" || marks[tr.id] === "LATE"
  );

  const handleToggleMark = (traineeId: string, status: AttendanceMark) => {
    setMarks((prev) => ({ ...prev, [traineeId]: status }));
  };

  const handleAddExternalTrainee = (trainee: { id: string; fullNameEn: string; fullNameAr: string }) => {
    // Check if already in the roster
    if (roster.some((tr) => tr.id === trainee.id)) return;

    // Add to roster as external
    const newTrainee: RosterTrainee = {
      id: trainee.id,
      fullNameEn: trainee.fullNameEn,
      fullNameAr: trainee.fullNameAr,
      isExternal: true,
    };

    setRoster((prev) => [...prev, newTrainee]);
    // Default external to PRESENT when added
    setMarks((prev) => ({ ...prev, [trainee.id]: "PRESENT" }));
  };

  const handleRemoveExternalTrainee = (traineeId: string) => {
    setRoster((prev) => prev.filter((tr) => tr.id !== traineeId));
    setMarks((prev) => {
      const next = { ...prev };
      delete next[traineeId];
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Searchable Attendance Roster Card */}
      <Card className="shadow-md border-muted-foreground/10">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-lg font-bold">
            <span>{t("attendanceTitle", { count: roster.length })}</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {locale === "ar" 
                ? `${attendedTrainees.length} حاضرين` 
                : `${attendedTrainees.length} attended`
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <AttendanceRoster
            sessionId={sessionId}
            trainees={roster}
            marks={marks}
            allSystemTrainees={allSystemTrainees}
            onToggleMark={handleToggleMark}
            onAddExternal={handleAddExternalTrainee}
            onRemoveExternal={handleRemoveExternalTrainee}
          />
        </CardContent>
      </Card>

      {/* Attended-Only Quick Evaluations Grid Card */}
      <Card className="shadow-md border-muted-foreground/10">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold">
            {locale === "ar" 
              ? "التقييمات الفنية والبدنية (للحاضرين فقط)" 
              : "Technical & Physical Evaluations (Attended Only)"
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <QuickEvalGrid
            sessionId={sessionId}
            svgContent={svgContent}
            trainees={attendedTrainees.map((tr) => {
              const matchingEval = initialQuickEvals.find((q) => q.traineeId === tr.id);
              return {
                traineeId: tr.id,
                fullNameEn: tr.fullNameEn,
                fullNameAr: tr.fullNameAr,
                current: matchingEval
                  ? {
                      effortScore: matchingEval.effortScore,
                      notes: matchingEval.notes,
                      flaggedBodyPart: matchingEval.flaggedBodyPart,
                      flaggedSkill: matchingEval.flaggedSkill,
                    }
                  : undefined,
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
