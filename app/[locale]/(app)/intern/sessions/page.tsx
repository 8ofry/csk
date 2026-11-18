import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InternSessionsPage() {
  const user = await requireRole("INTERN");

  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { internId: user.id },
        { group: { interns: { some: { internId: user.id } } } },
      ],
    },
    include: {
      group: { select: { name: true } },
      location: { select: { nameEn: true } },
      coach: { select: { fullNameEn: true } },
    },
    orderBy: { scheduledStart: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shadowed Sessions</h1>
        <p className="text-muted-foreground">Sessions assigned for your coaching internship</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shadowed sessions recorded yet.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {s.group.name} · {s.location.nameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Coach: {s.coach.fullNameEn} · {s.scheduledStart.toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
