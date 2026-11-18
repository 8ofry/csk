import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { listPrivateSessionsForUser } from "@/application/private-sessions/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TraineeSchedulePage() {
  const user = await requireRole("TRAINEE");
  const [enrollments, privateSessions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { traineeId: user.id, status: "ACTIVE" },
      include: {
        group: {
          include: {
            location: { select: { nameEn: true, nameAr: true } },
            discipline: { select: { nameEn: true } },
            coaches: {
              include: { coach: { select: { fullNameEn: true } } },
              take: 1,
            },
          },
        },
      },
    }),
    listPrivateSessionsForUser(user.id, "TRAINEE"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Training Schedule</h1>
        <p className="text-muted-foreground">Active group enrollments and private 1-on-1 sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active group enrollments.</p>
          ) : (
            enrollments.map((e) => {
              const sched = e.group.schedule as { days?: { day: string; startTime: string; endTime: string }[] } | null;
              return (
                <div key={e.id} className="rounded-md border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{e.group.name}</span>
                    <Badge variant="outline">{e.group.discipline.nameEn}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Location: {e.group.location.nameEn}
                    {e.group.coaches[0] ? ` · Coach: ${e.group.coaches[0].coach.fullNameEn}` : ""}
                  </p>
                  {sched?.days && sched.days.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sched.days.map((d, idx) => (
                        <Badge key={idx} variant="secondary">
                          {d.day} {d.startTime}–{d.endTime}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Private Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {privateSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No private sessions scheduled.</p>
          ) : (
            privateSessions.map((ps) => (
              <div key={ps.id} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">
                    Coach {ps.coach.fullNameEn} · {ps.location.nameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ps.scheduledStart.toLocaleString()} – {ps.scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <Badge variant="outline">{ps.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
