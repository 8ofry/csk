import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TraineeReportsPage() {
  const user = await requireRole("TRAINEE");

  const [monthlyReports, enrollments] = await Promise.all([
    prisma.monthlyReport.findMany({
      where: { traineeId: user.id, status: "APPROVED" },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.enrollment.findMany({
      where: { traineeId: user.id, status: "ACTIVE" },
      select: { groupId: true },
    }),
  ]);

  const groupIds = enrollments.map((e) => e.groupId);
  const dailyReports =
    groupIds.length > 0
      ? await prisma.dailyReport.findMany({
          where: {
            status: "APPROVED",
            session: { groupId: { in: groupIds } },
          },
          include: {
            session: {
              select: {
                scheduledStart: true,
                group: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">Approved monthly performance reports and daily session summaries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthlyReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved monthly reports yet.</p>
          ) : (
            monthlyReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">
                    {r.periodYear}-{String(r.periodMonth).padStart(2, "0")}
                  </span>
                  <span className="ms-2 text-xs text-muted-foreground">
                    Approved {r.approvedAt?.toLocaleDateString() ?? ""}
                  </span>
                </div>
                {r.pdfUrl ? (
                  <a
                    href={`/api/v1/files/${r.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-csk-gold px-3 py-1 text-xs font-semibold text-black hover:bg-csk-gold/90"
                  >
                    Download PDF
                  </a>
                ) : (
                  <Badge variant="outline">Approved</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Session Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No daily reports available yet.</p>
          ) : (
            dailyReports.map((d) => (
              <div key={d.id} className="rounded-md border p-4 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.session.group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.session.scheduledStart.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">{d.summary ?? "—"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
