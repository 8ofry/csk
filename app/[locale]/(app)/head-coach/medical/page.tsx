import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listExpiring } from "@/application/medical/service";
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
import { daysUntilExpiry } from "@/domain/medical/clearance";

export default async function HeadCoachMedicalPage() {
  await requireRole("HEAD_COACH");
  const [t, tBadges, docs] = await Promise.all([
    getTranslations("hcMedical"),
    getTranslations("badges"),
    listExpiring(60),
  ]);
  const now = new Date();

  const expired = docs.filter((d) => daysUntilExpiry(d.expiryDate, now) < 0);
  const expiring = docs.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate, now);
    return days >= 0 && days <= 30;
  });
  const upcoming = docs.filter((d) => daysUntilExpiry(d.expiryDate, now) > 30);

  const labels = {
    empty: t("empty"),
    emptyBadge: tBadges("empty"),
    trainee: t("table.trainee"),
    type: t("table.type"),
    expiry: t("table.expiry"),
    days: t("table.days"),
    file: t("table.file"),
    open: t("table.open"),
    agoSuffix: (n: number) => t("agoSuffix", { n }),
    inSuffix: (n: number) => t("inSuffix", { n }),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("expiredTitle", { count: expired.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Section docs={expired} now={now} variant="expired" labels={labels} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600 dark:text-amber-500">
            {t("expiringTitle", { count: expiring.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Section docs={expiring} now={now} variant="expiring" labels={labels} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingTitle", { count: upcoming.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Section docs={upcoming} now={now} variant="upcoming" labels={labels} />
        </CardContent>
      </Card>
    </div>
  );
}

type SectionLabels = {
  empty: string;
  emptyBadge: string;
  trainee: string;
  type: string;
  expiry: string;
  days: string;
  file: string;
  open: string;
  agoSuffix: (n: number) => string;
  inSuffix: (n: number) => string;
};

function Section({
  docs,
  now,
  variant,
  labels,
}: {
  docs: Awaited<ReturnType<typeof listExpiring>>;
  now: Date;
  variant: "expired" | "expiring" | "upcoming";
  labels: SectionLabels;
}) {
  if (docs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        <Badge variant="success">{labels.emptyBadge}</Badge> {labels.empty}
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.trainee}</TableHead>
          <TableHead>{labels.type}</TableHead>
          <TableHead>{labels.expiry}</TableHead>
          <TableHead>{labels.days}</TableHead>
          <TableHead>{labels.file}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((d) => {
          const days = daysUntilExpiry(d.expiryDate, now);
          return (
            <TableRow key={d.id}>
              <TableCell>
                <div className="font-medium">{d.trainee.fullNameEn}</div>
                <div className="text-xs text-muted-foreground">{d.trainee.fullNameAr}</div>
              </TableCell>
              <TableCell>{d.documentType}</TableCell>
              <TableCell>{d.expiryDate.toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    variant === "expired"
                      ? "destructive"
                      : variant === "expiring"
                        ? "warning"
                        : "outline"
                  }
                >
                  {days < 0 ? labels.agoSuffix(-days) : labels.inSuffix(days)}
                </Badge>
              </TableCell>
              <TableCell>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-csk-gold hover:underline"
                >
                  {labels.open}
                </a>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
