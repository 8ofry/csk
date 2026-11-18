import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { listPrivateSessionsForUser } from "@/application/private-sessions/service";
import {
  cancelPrivateSessionAction,
  completePrivateSessionAction,
  confirmPrivateSessionAction,
  createPrivateSessionAction,
} from "@/app/actions/private-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CoachPrivateSessionsPage() {
  const user = await requireRole("COACH");
  const [sessions, trainees, locations] = await Promise.all([
    listPrivateSessionsForUser(user.id, user.role),
    prisma.user.findMany({
      where: { role: "TRAINEE", status: "ACTIVE" },
      select: { id: true, fullNameEn: true },
      orderBy: { fullNameEn: "asc" },
      take: 200,
    }),
    prisma.location.findMany({
      where: { active: true },
      select: { id: true, nameEn: true },
      orderBy: { nameEn: "asc" },
    }),
  ]);

  async function handleCreate(fd: FormData) {
    "use server";
    await createPrivateSessionAction(fd);
  }
  async function handleConfirm(fd: FormData) {
    "use server";
    await confirmPrivateSessionAction(String(fd.get("id")));
  }
  async function handleComplete(fd: FormData) {
    "use server";
    await completePrivateSessionAction(String(fd.get("id")));
  }
  async function handleCancel(fd: FormData) {
    "use server";
    await cancelPrivateSessionAction(String(fd.get("id")));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Private Sessions</h1>
        <p className="text-muted-foreground">Schedule and manage 1-on-1 training sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Private Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select name="traineeId" required className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Select trainee...</option>
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullNameEn}
                </option>
              ))}
            </select>
            <input type="hidden" name="coachId" value={user.id} />
            <select name="locationId" required className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nameEn}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              name="scheduledStart"
              required
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="number"
              name="durationMins"
              defaultValue={60}
              min={30}
              max={180}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              placeholder="Duration (mins)"
            />
            <input
              type="number"
              name="fee"
              required
              min={1}
              step="0.01"
              placeholder="Fee (EGP)"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <button
              type="submit"
              className="h-9 rounded-md bg-csk-gold px-4 text-sm font-semibold text-black hover:bg-csk-gold/90"
            >
              Create Session
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No private sessions yet.</p>
          ) : (
            sessions.map((ps) => (
              <div key={ps.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {ps.trainee.fullNameEn} · {ps.location.nameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ps.scheduledStart.toLocaleString()} · {Number(ps.fee).toFixed(2)} EGP
                    {ps.confirmedAt ? " · Confirmed" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ps.status}</Badge>
                  {ps.status === "SCHEDULED" && !ps.confirmedAt && (
                    <form action={handleConfirm}>
                      <input type="hidden" name="id" value={ps.id} />
                      <button type="submit" className="rounded border px-2 py-1 text-xs hover:bg-muted">
                        Confirm
                      </button>
                    </form>
                  )}
                  {ps.status === "SCHEDULED" && (
                    <form action={handleComplete}>
                      <input type="hidden" name="id" value={ps.id} />
                      <button type="submit" className="rounded bg-csk-gold px-2 py-1 text-xs font-semibold text-black">
                        Complete
                      </button>
                    </form>
                  )}
                  {ps.status !== "COMPLETED" && ps.status !== "CANCELLED" && (
                    <form action={handleCancel}>
                      <input type="hidden" name="id" value={ps.id} />
                      <button type="submit" className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
