import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyReportActions } from "@/components/head-coach/daily-report-actions";
import { getBodyPartLabel } from "@/lib/body-parts";

export default async function HeadCoachDailyReportPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id, locale } = await params;
  const [t, tBadges, tActions, report] = await Promise.all([
    getTranslations("hcReviewReport"),
    getTranslations("badges"),
    getTranslations("hcApprovalActions"),
    prisma.dailyReport.findUnique({
      where: { id },
      include: {
        coach: { select: { fullNameEn: true, fullNameAr: true } },
        group: {
          select: {
            name: true,
            location: { select: { nameEn: true } },
            discipline: { select: { nameEn: true } },
          },
        },
        session: {
          include: {
            attendances: { include: { trainee: { select: { fullNameEn: true } } } },
            quickEvaluations: {
              include: { trainee: { select: { fullNameEn: true } } },
            },
          },
        },
      },
    }),
  ]);
  if (!report) notFound();

  const attendanceLabel = (status: string) => {
    switch (status) {
      case "PRESENT":
        return tBadges("present");
      case "ABSENT":
        return tBadges("absent");
      case "LATE":
        return tBadges("late");
      case "EXCUSED":
        return tBadges("excused");
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {report.group.name} · {report.group.location.nameEn} ·{" "}
          {report.session.scheduledStart.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("coachSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{report.summary ?? "—"}</p>
          {report.incidents && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("incidents")}</div>
              <p className="whitespace-pre-wrap text-sm">{report.incidents}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {t("submittedBy", {
              name: report.coach.fullNameEn,
              when: report.submittedAt?.toLocaleString() ?? "—",
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("attendanceTitle", { count: report.session.attendances.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
            {report.session.attendances.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>{a.trainee.fullNameEn}</span>
                <Badge
                  variant={
                    a.status === "PRESENT"
                      ? "success"
                      : a.status === "ABSENT"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {attendanceLabel(a.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("evaluationsTitle", { count: report.session.quickEvaluations.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {report.session.quickEvaluations.map((q) => {
              const parsed = parseStructuredNotes(q.notes);
              return (
                <li key={q.id} className="rounded-md border p-3.5 bg-card hover:bg-muted/10 transition space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <strong className="text-foreground font-semibold">{q.trainee.fullNameEn}</strong>
                    <Badge variant="outline" className="border-csk-gold/30 bg-csk-gold/5 text-csk-gold font-bold px-2.5 py-0.5">
                      {t("effortBadge", { score: q.effortScore })}
                    </Badge>
                  </div>
                  
                  {parsed ? (
                    <div className="space-y-3 pt-1 text-xs">
                      {/* General Muscle Condition */}
                      <div className="space-y-1.5 bg-muted/40 p-2.5 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-muted-foreground uppercase tracking-wide">
                            {locale === "ar" ? "قوة العضلة والحالة البدنية" : "Muscle Power & Condition"}
                          </span>
                          {q.flaggedBodyPart && (
                            <Badge variant="destructive" className="text-[10px] font-bold py-0 px-2.5">
                              {getBodyPartLabel(q.flaggedBodyPart, locale)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          {renderStars(parsed.generalScore)}
                          <span className="text-[10px] font-bold text-muted-foreground">({parsed.generalScore}/5)</span>
                        </div>
                        {parsed.generalComment && (
                          <p className="text-foreground mt-1 whitespace-pre-wrap leading-relaxed">{parsed.generalComment}</p>
                        )}
                      </div>

                      {/* Technical Actions — new multi-action array format */}
                      {parsed.technicalActions && parsed.technicalActions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-muted-foreground uppercase tracking-wide">
                            {locale === "ar" ? "الأداء الفني للحركات" : "Technical Actions Performance"}
                          </span>
                          {parsed.technicalActions.map((ta, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-muted/20 p-2 rounded border border-dashed">
                              <Badge variant="secondary" className="text-[10px] font-bold py-0 px-2 bg-csk-gold/15 text-foreground border border-csk-gold/20 shrink-0">
                                {getTechnicalActionLabel(ta.action, locale)}
                              </Badge>
                              <div className="flex items-center gap-1 shrink-0">
                                {renderStars(ta.score)}
                                <span className="text-[10px] font-bold text-muted-foreground">({ta.score}/5)</span>
                              </div>
                              {ta.comment && <p className="text-[11px] text-foreground truncate flex-1">{ta.comment}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legacy single technical action format */}
                      {!parsed.technicalActions && parsed.technicalAction && (
                        <div className="space-y-1.5 bg-muted/20 p-2.5 rounded border border-dashed">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-muted-foreground uppercase tracking-wide">
                              {locale === "ar" ? "الأداء الفني للحركة" : "Technical Action Performance"}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-bold py-0 px-2.5 bg-csk-gold/15 text-foreground border border-csk-gold/20">
                              {getTechnicalActionLabel(parsed.technicalAction, locale)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 py-0.5">
                            {renderStars(parsed.technicalScore ?? 0)}
                            <span className="text-[10px] font-bold text-muted-foreground">({parsed.technicalScore}/5)</span>
                          </div>
                          {parsed.technicalComment && (
                            <p className="text-foreground mt-1 whitespace-pre-wrap leading-relaxed">{parsed.technicalComment}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback to simple note and flagged body part/skill badge */
                    <div className="text-xs space-y-2 pt-1">
                      {q.notes && <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{q.notes}</p>}
                      {(q.flaggedBodyPart || q.flaggedSkill) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.flaggedBodyPart && (
                            <Badge variant="destructive" className="text-[10px]">
                              {getBodyPartLabel(q.flaggedBodyPart, locale)}
                            </Badge>
                          )}
                          {q.flaggedSkill && (
                            <Badge variant="secondary" className="text-[10px] bg-csk-gold/15 text-foreground border border-csk-gold/20">
                              {q.flaggedSkill}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
 
       <DailyReportActions
         reportId={report.id}
         labels={{
           approveDeliver: tActions("approveDeliver"),
           reject: tActions("reject"),
           cancelReject: tActions("cancelReject"),
           confirmReject: tActions("confirmReject"),
           rejectPlaceholder: tActions("rejectReportPlaceholder"),
           shortCommentError: tActions("shortCommentError"),
         }}
       />
     </div>
   );
 }

const TECHNICAL_ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  JAB: { en: "Jab", ar: "جاب / لكمة مستقيمة" },
  CROSS: { en: "Cross", ar: "كروس / لكمة مستقيمة خلفية" },
  HOOK: { en: "Hook", ar: "هوك / لكمة خطافية" },
  UPPERCUT: { en: "Uppercut", ar: "أبركوت / لكمة صاعدة" },
  BACK_FIST: { en: "Back Fist", ar: "باك فيست / لكمة خلفية" },
  FRONT_KICK: { en: "Front Kick", ar: "ركلة أمامية" },
  ROUNDHOUSE_KICK: { en: "Roundhouse Kick", ar: "ركلة دائرية" },
  SIDE_KICK: { en: "Side Kick", ar: "ركلة جانبية" },
  KNEE_STRIKE: { en: "Knee Strike", ar: "ضربة ركبة" },
  DEFENSE: { en: "Defense", ar: "الدفاع" },
  HEAD_MOVEMENT: { en: "Head Movement", ar: "حركة الرأس" },
  FOOTWORK: { en: "Footwork", ar: "تحركات القدمين" },
};

function getTechnicalActionLabel(action: string, locale: string) {
  const labelObj = TECHNICAL_ACTION_LABELS[action];
  if (!labelObj) return action;
  return locale === "ar" ? labelObj.ar : labelObj.en;
}

interface StructuredNote {
  generalScore: number;
  generalComment: string;
  // Legacy single-action format
  technicalAction?: string;
  technicalScore?: number;
  technicalComment?: string;
  // New multi-action array format
  technicalActions?: Array<{ action: string; score: number; comment: string }>;
}

function parseStructuredNotes(notes: string | null): StructuredNote | null {
  if (!notes) return null;
  try {
    const data = JSON.parse(notes);
    if (typeof data === "object" && data !== null) {
      return {
        generalScore: typeof data.generalScore === "number" ? data.generalScore : 0,
        generalComment: typeof data.generalComment === "string" ? data.generalComment : "",
        // Legacy
        technicalAction: typeof data.technicalAction === "string" ? data.technicalAction : undefined,
        technicalScore: typeof data.technicalScore === "number" ? data.technicalScore : undefined,
        technicalComment: typeof data.technicalComment === "string" ? data.technicalComment : undefined,
        // New array
        technicalActions: Array.isArray(data.technicalActions)
          ? data.technicalActions.map((ta: { action?: string; score?: number; comment?: string }) => ({
              action: ta.action ?? "",
              score: ta.score ?? 0,
              comment: ta.comment ?? "",
            }))
          : undefined,
      };
    }
  } catch {
    // Plain text fallback
  }
  return null;
}

function renderStars(score: number) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => {
        const starNum = i + 1;
        const active = starNum <= score;
        return (
          <svg
            key={i}
            className={`h-4.5 w-4.5 ${active ? "fill-amber-500 text-amber-500" : "fill-none text-muted-foreground/30"}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}
