import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { listLowStock, listMerchandise } from "@/application/merchandise/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function HeadCoachMerchandisePage() {
  await requireRole("HEAD_COACH");
  const [t, tBadges, items, lowStock] = await Promise.all([
    getTranslations("hcMerchandise"),
    getTranslations("badges"),
    listMerchandise(),
    listLowStock(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/head-coach/merchandise/new">{t("newButton")}</Link>
        </Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="text-amber-600 dark:text-amber-500">
              {t("lowStockTitle", { count: lowStock.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {lowStock.map((item) => (
                <li key={item.id} className="rounded-md border px-3 py-2">
                  <div className="font-medium">{item.nameEn}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("lowStockDetail", {
                      stock: item.stockLevel,
                      threshold: item.lowStockThreshold,
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("catalogTitle", { count: items.length })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.item")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead className="text-end">{t("table.cost")}</TableHead>
                <TableHead className="text-end">{t("table.sale")}</TableHead>
                <TableHead className="text-end">{t("table.stock")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-end">{t("table.sales")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.nameEn}</div>
                    <div className="text-xs text-muted-foreground">{item.nameAr}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-end">{Number(item.costPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-end">{Number(item.salePrice).toFixed(2)}</TableCell>
                  <TableCell className="text-end">
                    {item.stockLevel <= item.lowStockThreshold ? (
                      <Badge variant="warning">{item.stockLevel}</Badge>
                    ) : (
                      item.stockLevel
                    )}
                  </TableCell>
                  <TableCell>
                    {item.active ? (
                      <Badge variant="success">{tBadges("active")}</Badge>
                    ) : (
                      <Badge variant="secondary">{tBadges("archived")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-end">{item._count.sales}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/head-coach/merchandise/${item.id}`}>{t("table.open")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
