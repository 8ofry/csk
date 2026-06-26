import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { Link } from "@/i18n/navigation";
import { listUsers } from "@/application/users/service";
import type { AccountStatus, UserRole } from "@/domain/users/promotion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "@/components/admin/user-row-actions";

const ROLES: UserRole[] = ["ADMIN", "HEAD_COACH", "COACH", "INTERN", "TRAINEE"];
const STATUSES: AccountStatus[] = ["PENDING", "ACTIVE", "SUSPENDED"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; search?: string }>;
}) {
  await requireRole("HEAD_COACH");
  const sp = await searchParams;
  const filters = {
    role: ROLES.includes(sp.role as UserRole) ? (sp.role as UserRole) : undefined,
    status: STATUSES.includes(sp.status as AccountStatus)
      ? (sp.status as AccountStatus)
      : undefined,
    search: sp.search,
  };

  const [t, tCommon, users] = await Promise.all([
    getTranslations("adminUsers"),
    getTranslations("common"),
    listUsers(filters),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">{t("newUser")}</Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("role")}
          </label>
          <select
            name="role"
            defaultValue={filters.role ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{tCommon("all")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("status")}
          </label>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{tCommon("all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("search")}
          </label>
          <Input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <Button type="submit" size="sm" variant="outline">
          {tCommon("apply")}
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t("countLabel", { count: users.length })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("table.email")}</TableHead>
                <TableHead>{t("table.phone")}</TableHead>
                <TableHead>{t("table.lastLogin")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">{u.fullNameAr}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "ACTIVE"
                          ? "success"
                          : u.status === "SUSPENDED"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs">{u.phone ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.lastLoginAt?.toLocaleDateString() ?? t("table.never")}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/users/${u.id}`}>{t("form.editButton")}</Link>
                      </Button>
                      <UserRowActions userId={u.id} role={u.role} status={u.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("noResults")}
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
