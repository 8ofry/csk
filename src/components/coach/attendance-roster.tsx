"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkMarkAttendanceAction } from "@/app/actions/sessions";
import type { AttendanceMark } from "@/application/attendance/service";

interface RosterTrainee {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  current?: AttendanceMark;
}

const STATUS_CONFIG: { value: AttendanceMark; key: "present" | "late" | "absent" | "excused"; tone: string }[] = [
  { value: "PRESENT", key: "present", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { value: "LATE", key: "late", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "ABSENT", key: "absent", tone: "bg-red-500/15 text-red-700 dark:text-red-400" },
  { value: "EXCUSED", key: "excused", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
];

export function AttendanceRoster({
  sessionId,
  trainees,
}: {
  sessionId: string;
  trainees: RosterTrainee[];
}) {
  const t = useTranslations("coachAttendance");
  const [marks, setMarks] = useState<Record<string, AttendanceMark | undefined>>(
    Object.fromEntries(trainees.map((tr) => [tr.id, tr.current])),
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  function setMark(id: string, value: AttendanceMark) {
    setMarks((prev) => ({ ...prev, [id]: value }));
  }

  function save() {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      for (const [id, status] of Object.entries(marks)) {
        if (!status) continue;
        fd.set(`status:${id}`, status);
      }
      const result = await bulkMarkAttendanceAction(sessionId, fd);
      if (result.error) setError(result.error);
      else setSavedAt(new Date());
    });
  }

  const allMarked = trainees.every((tr) => marks[tr.id]);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {trainees.length === 0 && (
          <li className="rounded-md border p-4 text-sm text-muted-foreground">
            {t("noTrainees")}
          </li>
        )}
        {trainees.map((tr) => (
          <li
            key={tr.id}
            className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="font-medium">{tr.fullNameEn}</div>
              <div className="text-xs text-muted-foreground">{tr.fullNameAr}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_CONFIG.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setMark(tr.id, s.value)}
                  aria-pressed={marks[tr.id] === s.value}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    marks[tr.id] === s.value
                      ? `${s.tone} border-current`
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t(`marks.${s.key}`)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {savedAt && (
            <Badge variant="success">{t("savedAt", { time: savedAt.toLocaleTimeString() })}</Badge>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button onClick={save} disabled={pending || trainees.length === 0} size="lg">
          {pending ? "..." : allMarked ? t("saveBtn") : t("saveBtnIncomplete")}
        </Button>
      </div>
    </div>
  );
}
