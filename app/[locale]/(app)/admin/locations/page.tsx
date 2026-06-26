import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listLocations } from "@/application/locations/service";
import { requireRole } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LocationsPage() {
  await requireRole("HEAD_COACH");
  const [t, tBadges, locations] = await Promise.all([
    getTranslations("adminLocations"),
    getTranslations("badges"),
    listLocations(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/locations/new">{t("newButton")}</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.district")}</TableHead>
            <TableHead>{t("table.ownership")}</TableHead>
            <TableHead className="text-end">{t("table.groups")}</TableHead>
            <TableHead className="text-end">{t("table.sessions")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell>
                <div className="font-medium">{loc.nameEn}</div>
                <div className="text-xs text-muted-foreground">{loc.nameAr}</div>
              </TableCell>
              <TableCell>{loc.district}</TableCell>
              <TableCell>
                {loc.ownership === "CSK_OWNED" ? (
                  <Badge>{t("ownership.cskOwned")}</Badge>
                ) : loc.ownership === "PARTNER" ? (
                  <Badge variant="outline">{t("ownership.partner")}</Badge>
                ) : loc.ownership === "PATRONAGE" ? (
                  <Badge variant="secondary">{t("ownership.patronage")}</Badge>
                ) : (
                  <Badge variant="secondary">{loc.ownership}</Badge>
                )}
              </TableCell>
              <TableCell className="text-end">{loc._count.groups}</TableCell>
              <TableCell className="text-end">{loc._count.sessions}</TableCell>
              <TableCell>
                {loc.active ? (
                  <Badge variant="success">{tBadges("active")}</Badge>
                ) : (
                  <Badge variant="secondary">{tBadges("archived")}</Badge>
                )}
              </TableCell>
              <TableCell className="text-end">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/locations/${loc.id}`}>{t("table.edit")}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {locations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
