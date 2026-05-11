import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getBeltExam } from "@/application/belt-exams/service";
import { listActiveTrainees } from "@/application/users/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordResultRow } from "@/components/head-coach/record-belt-result-row";

export default async function BeltExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, tBadges, exam, trainees] = await Promise.all([
    getTranslations("hcBeltExamDetail"),
    getTranslations("badges"),
    getBeltExam(id),
    listActiveTrainees(),
  ]);
  if (!exam) notFound();
  const recordedIds = new Set(exam.results.map((r) => r.traineeId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title", { discipline: exam.discipline.nameEn })}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", {
            date: exam.examDate.toLocaleDateString(),
            location: exam.locationLabel,
            examiner: exam.examinerName,
            fee: Number(exam.fee).toFixed(2),
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recordedTitle", { count: exam.results.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.trainee")}</TableHead>
                <TableHead>{t("table.result")}</TableHead>
                <TableHead>{t("table.score")}</TableHead>
                <TableHead>{t("table.newLevel")}</TableHead>
                <TableHead>{t("table.recorded")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.trainee.fullNameEn}</TableCell>
                  <TableCell>
                    <Badge variant={r.result === "PASSED" ? "success" : "destructive"}>
                      {r.result === "PASSED" ? tBadges("passed") : tBadges("failed")}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.score?.toString() ?? "—"}</TableCell>
                  <TableCell>{r.newLevel ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.recordedAt.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {exam.results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("addResultTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordResultRow
            examId={exam.id}
            trainees={trainees.filter((tr) => !recordedIds.has(tr.id))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
