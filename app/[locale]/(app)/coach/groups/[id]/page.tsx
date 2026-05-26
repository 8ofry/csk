import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGroup } from "@/application/groups/service";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduleJson {
  days?: string[];
  startTime?: string;
  endTime?: string;
}

export default async function CoachGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("COACH");
  const { id } = await params;
  const locale = await getLocale();

  const [tBadges, group] = await Promise.all([
    getTranslations("badges"),
    getGroup(id),
  ]);

  if (!group) notFound();

  // Verify coach assignment
  const isAssigned = group.coaches.some((c) => c.coachId === user.id);
  if (!isAssigned) notFound();

  // Fetch all sessions for this group
  const sessions = await prisma.session.findMany({
    where: { groupId: id },
    include: {
      coach: { select: { fullNameEn: true, fullNameAr: true } },
      dailyReport: { select: { id: true, status: true } },
    },
    orderBy: { scheduledStart: "desc" },
  });

  const schedule = (group.schedule as ScheduleJson | null) ?? {};

  const statusVariant = (s: string) => {
    if (s === "COMPLETED") return "success" as const;
    if (s === "IN_PROGRESS") return "warning" as const;
    return "secondary" as const;
  };

  const reportBadge = (status: string | undefined) => {
    if (!status) return null;
    if (status === "APPROVED")
      return (
        <Badge variant="success" className="text-[10px]">
          {tBadges("approved")}
        </Badge>
      );
    if (status === "PENDING")
      return (
        <Badge variant="warning" className="text-[10px]">
          {tBadges("submitted")}
        </Badge>
      );
    if (status === "REJECTED")
      return (
        <Badge variant="destructive" className="text-[10px]">
          {tBadges("rejected")}
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-[10px]">
        {tBadges("draft")}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link href="/coach/groups">←</Link>
            </Button>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <Badge variant={group.active ? "success" : "secondary"}>
              {group.active ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {locale === "ar" ? group.location.nameAr : group.location.nameEn} ·{" "}
            {locale === "ar" ? group.discipline.nameAr : group.discipline.nameEn}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left main column: Trainees & Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Trainees */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "أعضاء المجموعة" : "Enrolled Trainees"}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  ({group.enrollments.length} / {group.capacity})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{locale === "ar" ? "تاريخ الالتحاق" : "Enrolled Since"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {locale === "ar" ? e.trainee.fullNameAr : e.trainee.fullNameEn}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.startDate.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {group.enrollments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        {locale === "ar" ? "لا يوجد متدربون في هذه المجموعة حالياً." : "No trainees enrolled in this group."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Group Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "سجل الحصص التدريبية" : "Session History"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "التاريخ والوقت" : "Date & Time"}</TableHead>
                    <TableHead>{locale === "ar" ? "المدرب" : "Coach"}</TableHead>
                    <TableHead>{locale === "ar" ? "حالة الحصة" : "Session Status"}</TableHead>
                    <TableHead>{locale === "ar" ? "التقرير اليومي" : "Daily Report"}</TableHead>
                    <TableHead className="text-end">{locale === "ar" ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">
                        {s.scheduledStart.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        ·{" "}
                        {s.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {locale === "ar" ? s.coach.fullNameAr : s.coach.fullNameEn}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(s.status)} className="text-[10px]">
                          {s.status === "COMPLETED"
                            ? (locale === "ar" ? "مكتملة" : "Completed")
                            : s.status === "IN_PROGRESS"
                            ? tBadges("inProgress")
                            : s.status === "CANCELLED"
                            ? (locale === "ar" ? "ملغاة" : "Cancelled")
                            : (locale === "ar" ? "مجدولة" : "Scheduled")}
                        </Badge>
                      </TableCell>
                      <TableCell>{reportBadge(s.dailyReport?.status)}</TableCell>
                      <TableCell className="text-end">
                        <Link
                          href={`/coach/sessions/${s.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-csk-gold/60 px-3 text-xs font-semibold text-csk-gold hover:bg-csk-gold/10 transition-colors"
                        >
                          {locale === "ar" ? "عرض" : "View"}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {locale === "ar" ? "لا توجد حصص تدريبية مسجلة لهذه المجموعة." : "No sessions recorded for this group."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar column: Group Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "تفاصيل المجموعة" : "Group Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="block font-medium text-muted-foreground text-xs uppercase">
                  {locale === "ar" ? "المواعيد" : "Schedule"}
                </span>
                <span className="mt-1 block">
                  {(schedule.days ?? []).join(", ")}
                  {schedule.startTime && (
                    <>
                      <br />
                      {schedule.startTime} – {schedule.endTime}
                    </>
                  )}
                </span>
              </div>

              <div>
                <span className="block font-medium text-muted-foreground text-xs uppercase">
                  {locale === "ar" ? "المدربون المسندون" : "Assigned Coaches"}
                </span>
                <span className="mt-1 block space-y-1">
                  {group.coaches.map((c) => (
                    <div key={c.id} className="flex flex-wrap gap-1 items-center">
                      <span className="font-medium">
                        {locale === "ar" ? c.coach.fullNameAr : c.coach.fullNameEn}
                      </span>
                      {c.levels.map((lvl) => (
                        <Badge key={lvl} variant="outline" className="text-[10px]">
                          {lvl}
                        </Badge>
                      ))}
                    </div>
                  ))}
                </span>
              </div>

              {group.interns.length > 0 && (
                <div>
                  <span className="block font-medium text-muted-foreground text-xs uppercase">
                    {locale === "ar" ? "المتدربون المساعدون" : "Assigned Interns"}
                  </span>
                  <span className="mt-1 block">
                    {group.interns
                      .map((i) => (locale === "ar" ? i.intern.fullNameAr : i.intern.fullNameEn))
                      .join(", ")}
                  </span>
                </div>
              )}

              <div>
                <span className="block font-medium text-muted-foreground text-xs uppercase">
                  {locale === "ar" ? "المرحلة السنية" : "Age Limits"}
                </span>
                <span className="mt-1 block">
                  {group.ageBandMin || group.ageBandMax
                    ? `${group.ageBandMin ?? 0} – ${group.ageBandMax ?? "∞"} ${locale === "ar" ? "سنة" : "years"}`
                    : (locale === "ar" ? "لا يوجد قيود سنية" : "No age limits")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
