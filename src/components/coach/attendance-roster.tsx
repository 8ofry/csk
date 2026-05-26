"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkMarkAttendanceAction } from "@/app/actions/sessions";
import type { AttendanceMark } from "@/application/attendance/service";

export interface RosterTrainee {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  isExternal?: boolean;
  current?: AttendanceMark;
}

const STATUS_CONFIG: { value: AttendanceMark; key: "present" | "late" | "absent" | "excused"; tone: string }[] = [
  { value: "PRESENT", key: "present", tone: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  { value: "LATE", key: "late", tone: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  { value: "ABSENT", key: "absent", tone: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400" },
  { value: "EXCUSED", key: "excused", tone: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400" },
];

export function AttendanceRoster({
  sessionId,
  trainees,
  marks,
  allSystemTrainees,
  onToggleMark,
  onAddExternal,
  onRemoveExternal,
}: {
  sessionId: string;
  trainees: RosterTrainee[];
  marks: Record<string, AttendanceMark | undefined>;
  allSystemTrainees: { id: string; fullNameEn: string; fullNameAr: string }[];
  onToggleMark: (id: string, status: AttendanceMark) => void;
  onAddExternal: (trainee: { id: string; fullNameEn: string; fullNameAr: string }) => void;
  onRemoveExternal: (id: string) => void;
}) {
  const t = useTranslations("coachAttendance");
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  // Save the full roster's attendance
  const save = () => {
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
  };

  // Filter system trainees based on search query
  const queryLower = searchQuery.toLowerCase().trim();
  const searchResults = allSystemTrainees.filter((st) => {
    if (!queryLower) return true; // show all when focused but empty
    return (
      st.fullNameEn.toLowerCase().includes(queryLower) ||
      st.fullNameAr.includes(queryLower)
    );
  });

  // Separate search results into Group Trainees vs External Trainees
  const groupTraineeIds = new Set(trainees.filter((tr) => !tr.isExternal).map((tr) => tr.id));
  
  const searchGroupTrainees = searchResults.filter((st) => groupTraineeIds.has(st.id));
  const searchExternalTrainees = searchResults.filter((st) => !groupTraineeIds.has(st.id));

  // Trainees that are currently added to the active marked list on screen
  const activeTrainees = trainees.filter((tr) => marks[tr.id] !== undefined || tr.isExternal);

  const handleSelectTrainee = (st: { id: string; fullNameEn: string; fullNameAr: string }, isExt: boolean) => {
    if (isExt) {
      onAddExternal(st);
    } else {
      // For group trainees, default to PRESENT when searched and added
      onToggleMark(st.id, "PRESENT");
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input & Dropdown Menu */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                locale === "ar"
                  ? "🔍 ابحث عن اسم المتدرب لتحضيره..."
                  : "🔍 Search trainee name to check in..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold disabled:cursor-not-allowed disabled:opacity-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {isOpen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              {locale === "ar" ? "إغلاق" : "Close"}
            </Button>
          )}
        </div>

        {/* Dropdown Box */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg z-20 p-2 divide-y animate-in fade-in slide-in-from-top-1 duration-150">
              
              {/* Group Roster section */}
              {searchGroupTrainees.length > 0 && (
                <div className="py-1.5">
                  <div className="px-2 pb-1 text-xs font-bold text-csk-gold tracking-wide uppercase">
                    {locale === "ar" ? "أعضاء الفوج الحالي" : "Group Roster"}
                  </div>
                  {searchGroupTrainees.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectTrainee(st, false)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted transition"
                    >
                      <div className="min-w-0 flex-1 text-start">
                        <div className="font-medium truncate">{st.fullNameEn}</div>
                        <div className="text-xs text-muted-foreground truncate">{st.fullNameAr}</div>
                      </div>
                      {marks[st.id] && (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                          {marks[st.id]}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* External Trainees section */}
              {searchExternalTrainees.length > 0 && (
                <div className="py-1.5">
                  <div className="px-2 pb-1 text-xs font-bold text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
                    <span>{locale === "ar" ? "متدربين من أفواج أخرى" : "External Trainees (Other Groups)"}</span>
                    <Badge variant="outline" className="text-[9px] font-semibold bg-muted/40 shrink-0">
                      {locale === "ar" ? "خارجي" : "External"}
                    </Badge>
                  </div>
                  {searchExternalTrainees.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectTrainee(st, true)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted transition"
                    >
                      <div className="min-w-0 flex-1 text-start">
                        <div className="font-medium truncate">{st.fullNameEn}</div>
                        <div className="text-xs text-muted-foreground truncate">{st.fullNameAr}</div>
                      </div>
                      {marks[st.id] ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                          {marks[st.id]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-csk-gold font-semibold shrink-0">
                          {locale === "ar" ? "+ تحضير" : "+ Check-in"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {locale === "ar" ? "لم يتم العثور على نتائج" : "No matches found"}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Active Check-in List (only show trainees marked or added) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {locale === "ar" ? "المتدربين الحاضرين والنشطين بالحصة" : "Active Check-in Roster"}
        </div>
        
        {activeTrainees.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/5 select-none">
            {locale === "ar" 
              ? "انقر على مربع البحث بالأعلى للبحث عن المتدربين وتحضيرهم." 
              : "Search trainees above to check them in."}
          </div>
        ) : (
          <ul className="space-y-2">
            {activeTrainees.map((tr) => (
              <li
                key={tr.id}
                className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{tr.fullNameEn}</span>
                    {tr.isExternal && (
                      <Badge variant="secondary" className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5">
                        {locale === "ar" ? "خارجي" : "External"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{tr.fullNameAr}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {STATUS_CONFIG.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => onToggleMark(tr.id, s.value)}
                        aria-pressed={marks[tr.id] === s.value}
                        className={`rounded-md border h-9 px-2.5 text-xs font-semibold tracking-wide transition ${
                          marks[tr.id] === s.value
                            ? `${s.tone} border-current ring-1 ring-current shadow-sm`
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t(`marks.${s.key}`)}
                      </button>
                    ))}
                  </div>

                  {/* Remove Button for External Trainees */}
                  {tr.isExternal && (
                    <button
                      type="button"
                      onClick={() => onRemoveExternal(tr.id)}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 transition"
                      title={locale === "ar" ? "حذف" : "Remove"}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Roster Controls (Save Button & badges) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div>
          {savedAt && (
            <Badge variant="success">{t("savedAt", { time: savedAt.toLocaleTimeString() })}</Badge>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button onClick={save} disabled={pending || activeTrainees.length === 0} size="lg">
          {pending ? "..." : t("saveBtn")}
        </Button>
      </div>
    </div>
  );
}
