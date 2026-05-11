import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPlansForCoach } from "@/application/session-plans/service";
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

function statusBadge(status: string, labels: Record<string, string>) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">{labels.draft}</Badge>;
    case "PENDING":
      return <Badge variant="warning">{labels.pending}</Badge>;
    case "APPROVED":
      return <Badge variant="success">{labels.approved}</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">{labels.rejected}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default async function MyPlansPage() {
  const user = await requireRole("COACH");
  const [t, tCommon, tBadges, plans] = await Promise.all([
    getTranslations("sessionPlans"),
    getTranslations("common"),
    getTranslations("badges"),
    listPlansForCoach(user.id),
  ]);
  const labels = {
    draft: tBadges("draft"),
    pending: tBadges("pending"),
    approved: tBadges("approved"),
    rejected: tBadges("rejected"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/coach/session-plans/new">{t("newPlan")}</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.dateOrTemplate")}</TableHead>
            <TableHead>{t("table.group")}</TableHead>
            <TableHead>{t("table.units")}</TableHead>
            <TableHead>{tCommon("status")}</TableHead>
            <TableHead className="text-end">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((p) => {
            const units = (p.unitsSequence as unknown[]).length;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  {p.isTemplate ? (
                    <span>
                      <Badge variant="outline">{t("templateLabel")}</Badge>{" "}
                      <span className="ms-2">{p.templateName ?? t("templateUntitled")}</span>
                    </span>
                  ) : (
                    p.sessionDate.toLocaleString()
                  )}
                </TableCell>
                <TableCell>
                  {p.group.name}{" "}
                  <span className="text-xs text-muted-foreground">@ {p.group.location.nameEn}</span>
                </TableCell>
                <TableCell>{units}</TableCell>
                <TableCell>{statusBadge(p.status, labels)}</TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/coach/session-plans/${p.id}`}>{t("table.open")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {plans.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {t("noPlans")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
