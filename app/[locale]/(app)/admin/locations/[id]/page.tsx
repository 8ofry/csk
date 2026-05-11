import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getLocation } from "@/application/locations/service";
import { requireRole } from "@/lib/auth-guard";
import { LocationForm } from "@/components/admin/location-form";
import { updateLocationAction } from "@/app/actions/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [t, location] = await Promise.all([
    getTranslations("adminLocations.detail"),
    getLocation(id),
  ]);
  if (!location) notFound();

  const update = updateLocationAction.bind(null, id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{location.nameEn}</h1>
        <p className="text-muted-foreground">{location.nameAr} · {location.district}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationForm
            defaultValues={{
              nameAr: location.nameAr,
              nameEn: location.nameEn,
              district: location.district,
              address: location.address,
              latitude: location.latitude ? Number(location.latitude) : null,
              longitude: location.longitude ? Number(location.longitude) : null,
              ownership: location.ownership,
              contactPerson: location.contactPerson,
              contactPhone: location.contactPhone,
              active: location.active,
            }}
            onSubmit={update}
            submitLabel={t("saveChanges")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("splitsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("splitsTable.stream")}</TableHead>
                <TableHead className="text-end">{t("splitsTable.venue")}</TableHead>
                <TableHead className="text-end">{t("splitsTable.csk")}</TableHead>
                <TableHead className="text-end">{t("splitsTable.coach")}</TableHead>
                <TableHead className="text-end">{t("splitsTable.other")}</TableHead>
                <TableHead>{t("splitsTable.otherLabel")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {location.splitRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.revenueType}</TableCell>
                  <TableCell className="text-end">{r.venuePercent.toString()}%</TableCell>
                  <TableCell className="text-end">{r.cskPercent.toString()}%</TableCell>
                  <TableCell className="text-end">{r.coachPercent.toString()}%</TableCell>
                  <TableCell className="text-end">{r.otherPercent.toString()}%</TableCell>
                  <TableCell>{r.otherLabel ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">{t("splitsNote")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
