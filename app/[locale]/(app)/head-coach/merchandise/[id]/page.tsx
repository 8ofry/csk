import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getMerchandise } from "@/application/merchandise/service";
import { listLocations } from "@/application/locations/service";
import { listActiveTrainees } from "@/application/users/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchandiseForm } from "@/components/head-coach/merchandise-form";
import { LogSaleForm } from "@/components/head-coach/log-sale-form";
import { updateMerchandiseAction } from "@/app/actions/merchandise";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function MerchandiseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, item, locations, trainees] = await Promise.all([
    getTranslations("hcMerchDetail"),
    getMerchandise(id),
    listLocations(),
    listActiveTrainees(),
  ]);
  if (!item) notFound();

  const update = updateMerchandiseAction.bind(null, id);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{item.nameEn}</h1>
          {item.stockLevel <= item.lowStockThreshold && (
            <Badge variant="warning">{t("lowStock")}</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {t("subtitle", {
            nameAr: item.nameAr,
            sale: Number(item.salePrice).toFixed(2),
            cost: Number(item.costPrice).toFixed(2),
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("logSaleTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LogSaleForm
            itemId={item.id}
            defaultUnitPrice={Number(item.salePrice)}
            variants={(item.variants as string[] | null) ?? []}
            locations={locations.map((l) => ({ id: l.id, label: l.nameEn }))}
            trainees={trainees}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchandiseForm
            defaultValues={{
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              description: item.description,
              category: item.category,
              photos: item.photos,
              variants: (item.variants as string[] | null) ?? [],
              costPrice: Number(item.costPrice),
              salePrice: Number(item.salePrice),
              stockLevel: item.stockLevel,
              lowStockThreshold: item.lowStockThreshold,
              active: item.active,
            }}
            onSubmit={update}
            submitLabel={t("saveChanges")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentSalesTitle", { count: item.sales.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.customer")}</TableHead>
                <TableHead>{t("table.soldBy")}</TableHead>
                <TableHead>{t("table.variant")}</TableHead>
                <TableHead className="text-end">{t("table.qty")}</TableHead>
                <TableHead className="text-end">{t("table.totalEgp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{s.soldAt.toLocaleString()}</TableCell>
                  <TableCell>{s.customer?.fullNameEn ?? t("walkIn")}</TableCell>
                  <TableCell>{s.soldBy.fullNameEn}</TableCell>
                  <TableCell>{s.variantSku ?? "—"}</TableCell>
                  <TableCell className="text-end">{s.quantity}</TableCell>
                  <TableCell className="text-end">{Number(s.totalPrice).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {item.sales.length === 0 && (
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
