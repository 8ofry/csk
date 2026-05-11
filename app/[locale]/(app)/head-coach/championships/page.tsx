import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { listChampionships } from "@/application/championships/service";
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
import { createChampionshipFormAction } from "@/app/actions/championships";

export default async function ChampionshipsPage() {
  await requireRole("HEAD_COACH");
  const [t, tBadges, events, disciplines] = await Promise.all([
    getTranslations("hcChampionships"),
    getTranslations("badges"),
    listChampionships(),
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
          <form action={createChampionshipFormAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">{t("form.name")}</Label>
              <Input id="name" name="name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="organizer">{t("form.organizer")}</Label>
              <Input id="organizer" name="organizer" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="locationLabel">{t("form.location")}</Label>
              <Input id="locationLabel" name="locationLabel" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="startDate">{t("form.startDate")}</Label>
              <Input id="startDate" name="startDate" type="date" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="endDate">{t("form.endDate")}</Label>
              <Input id="endDate" name="endDate" type="date" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="registrationDeadline">{t("form.deadline")}</Label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="registrationFee">{t("form.fee")}</Label>
              <Input
                id="registrationFee"
                name="registrationFee"
                type="number"
                step="0.01"
                min={0}
                required
                className="mt-1"
              />
            </div>
            <fieldset className="md:col-span-2 rounded-md border p-3">
              <legend className="px-2 text-sm font-medium">{t("form.disciplines")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {disciplines.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10"
                  >
                    <input
                      type="checkbox"
                      name="disciplineIds"
                      value={d.id}
                      className="h-4 w-4 accent-csk-gold"
                    />
                    {d.nameEn}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="md:col-span-2 rounded-md border p-3">
              <legend className="px-2 text-sm font-medium">{t("form.allowedLevels")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {["N", "A", "B", "C"].map((lv) => (
                  <label
                    key={lv}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10"
                  >
                    <input
                      type="checkbox"
                      name="allowedLevels"
                      value={lv}
                      defaultChecked
                      className="h-4 w-4 accent-csk-gold"
                    />
                    {lv}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <Label htmlFor="weightCategories">{t("form.weightCategories")}</Label>
              <Input
                id="weightCategories"
                name="weightCategories"
                placeholder={t("form.weightPlaceholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ageCategories">{t("form.ageCategories")}</Label>
              <Input
                id="ageCategories"
                name="ageCategories"
                placeholder={t("form.agePlaceholder")}
                className="mt-1"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isOfficial" defaultChecked className="h-4 w-4 accent-csk-gold" />
              {t("form.official")}
            </label>
            <div className="md:col-span-2">
              <Label htmlFor="notes">{t("form.notes")}</Label>
              <Input id="notes" name="notes" className="mt-1" />
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
                <TableHead>{t("table.event")}</TableHead>
                <TableHead>{t("table.dates")}</TableHead>
                <TableHead>{t("table.deadline")}</TableHead>
                <TableHead>{t("table.fee")}</TableHead>
                <TableHead className="text-end">{t("table.registrations")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.organizer} · {e.locationLabel}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.startDate.toLocaleDateString()} – {e.endDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.registrationDeadline.toLocaleDateString()}
                    {e.registrationDeadline < new Date() && (
                      <Badge variant="secondary" className="ms-2">
                        {tBadges("closed")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{Number(e.registrationFee).toFixed(2)} EGP</TableCell>
                  <TableCell className="text-end">{e._count.registrations}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/head-coach/championships/${e.id}`}>{t("table.open")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
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
