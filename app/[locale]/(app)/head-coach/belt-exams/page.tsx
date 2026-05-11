import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { listBeltExams } from "@/application/belt-exams/service";
import { listDisciplines } from "@/application/disciplines/service";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBeltExamFormAction } from "@/app/actions/belt-exams";

export default async function BeltExamsPage() {
  await requireRole("HEAD_COACH");
  const [t, exams, disciplines] = await Promise.all([
    getTranslations("hcBeltExams"),
    listBeltExams(),
    listDisciplines(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("newCardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBeltExamFormAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="disciplineId">{t("form.discipline")}</Label>
              <select
                id="disciplineId"
                name="disciplineId"
                required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
              >
                <option value="">{t("form.pickPlaceholder")}</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="examDate">{t("form.date")}</Label>
              <Input id="examDate" name="examDate" type="date" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="locationLabel">{t("form.location")}</Label>
              <Input
                id="locationLabel"
                name="locationLabel"
                required
                placeholder={t("form.locationPlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="federation">{t("form.federation")}</Label>
              <Input id="federation" name="federation" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="examinerName">{t("form.examiner")}</Label>
              <Input id="examinerName" name="examinerName" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="fee">{t("form.fee")}</Label>
              <Input id="fee" name="fee" type="number" step="0.01" min={0} required className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{t("form.submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.discipline")}</TableHead>
                <TableHead>{t("table.federation")}</TableHead>
                <TableHead>{t("table.examiner")}</TableHead>
                <TableHead className="text-end">{t("table.results")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.examDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.discipline.nameEn}</Badge>
                  </TableCell>
                  <TableCell>{e.federation}</TableCell>
                  <TableCell>{e.examinerName}</TableCell>
                  <TableCell className="text-end">{e._count.results}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/head-coach/belt-exams/${e.id}`}>{t("table.open")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
