import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPendingApproval } from "@/application/session-plans/service";
import { listOverdueDailyReports, listPendingDailyReports } from "@/application/daily-reports/service";
import { listPending } from "@/application/users/service";
import { requireRole } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApproveUserButton } from "@/components/head-coach/approve-user-button";

export default async function ApprovalsInboxPage() {
  await requireRole("HEAD_COACH");
  const [t, tCommon, tBadges, tApproveUser, pendingPlans, pendingReports, overdueReports, pendingUsers] =
    await Promise.all([
      getTranslations("approvals"),
      getTranslations("common"),
      getTranslations("badges"),
      getTranslations("approvals"),
      listPendingApproval(),
      listPendingDailyReports(),
      listOverdueDailyReports(),
      listPending(),
    ]);
  const overdueIds = new Set(overdueReports.map((r) => r.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("pendingUsersTitle")} ({pendingUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tApproveUser("table.role")}</TableHead>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>{t("table.emailPhone")}</TableHead>
                <TableHead>{t("table.submittedHeader")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{u.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">{u.fullNameAr}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{u.email}</div>
                    <div className="text-muted-foreground">{u.phone ?? "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <ApproveUserButton userId={u.id} />
                  </TableCell>
                </TableRow>
              ))}
              {pendingUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    <Badge variant="success">{tBadges("empty")}</Badge> — {t("noPendingUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("sessionPlansTitle")} ({pendingPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.sessionDate")}</TableHead>
                <TableHead>{t("table.group")}</TableHead>
                <TableHead>{t("table.coach")}</TableHead>
                <TableHead>{t("table.units")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPlans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.sessionDate.toLocaleString()}</TableCell>
                  <TableCell>
                    {p.group.name}{" "}
                    <span className="text-xs text-muted-foreground">@ {p.group.location.nameEn}</span>
                  </TableCell>
                  <TableCell>{p.createdBy.fullNameEn}</TableCell>
                  <TableCell>{(p.unitsSequence as unknown[]).length}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/head-coach/approvals/${p.id}`}>{tCommon("review")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingPlans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    <Badge variant="success">{tBadges("empty")}</Badge> — {t("noPendingPlans")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("dailyReportsTitle")} ({pendingReports.length}){" "}
            {overdueIds.size > 0 && (
              <Badge variant="destructive">{t("overdueTag", { count: overdueIds.size })}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.submittedAt")}</TableHead>
                <TableHead>{t("table.group")}</TableHead>
                <TableHead>{t("table.coach")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.submittedAt?.toLocaleString() ?? "—"}{" "}
                    {overdueIds.has(r.id) && (
                      <Badge variant="destructive">{tBadges("overdue")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.group.name}{" "}
                    <span className="text-xs text-muted-foreground">@ {r.group.location.nameEn}</span>
                  </TableCell>
                  <TableCell>{r.coach.fullNameEn}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/head-coach/daily-reports/${r.id}`}>{tCommon("review")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    <Badge variant="success">{tBadges("empty")}</Badge> — {t("noPendingReports")}
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
