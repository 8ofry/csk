import { requireRole } from "@/lib/auth-guard";
import { listAuditLogs } from "@/application/audit/service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const logs = await listAuditLogs({
    action: sp.action,
    entityType: sp.entityType,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Security, RBAC, financial, and operational events</p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="action"
          defaultValue={sp.action ?? ""}
          placeholder="Filter by action (e.g. auth., payment.)"
          className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
        />
        <input
          type="text"
          name="entityType"
          defaultValue={sp.entityType ?? ""}
          placeholder="Entity type (e.g. User, Payment)"
          className="h-9 w-52 rounded-md border bg-background px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-csk-gold px-4 text-sm font-semibold text-black hover:bg-csk-gold/90"
        >
          Filter
        </button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {l.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.actor ? `${l.actor.fullNameEn} (${l.actor.role})` : "System / Public"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.entityType}
                    {l.entityId ? ` · ${l.entityId.slice(0, 10)}` : ""}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {l.changes ? JSON.stringify(l.changes) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit entries found.
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
