import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { listTraineeCoachEvaluations } from "@/application/evaluations/coach-eval-service";
import { submitCoachEvaluationAction } from "@/app/actions/coach-eval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TraineeEvaluationsPage() {
  const user = await requireRole("TRAINEE");

  const [attended, coachEvals, detailedEvals] = await Promise.all([
    prisma.attendance.findMany({
      where: { traineeId: user.id, status: { in: ["PRESENT", "LATE"] } },
      include: {
        session: {
          include: {
            group: { select: { name: true } },
            coach: { select: { fullNameEn: true } },
          },
        },
      },
      orderBy: { markedAt: "desc" },
      take: 15,
    }),
    listTraineeCoachEvaluations(user.id),
    prisma.detailedEvaluation.findMany({
      where: { traineeId: user.id },
      include: { evaluator: { select: { fullNameEn: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const evaluatedSessionIds = new Set(coachEvals.map((c) => c.sessionId));
  const pendingSessions = attended.filter((a) => !evaluatedSessionIds.has(a.sessionId));

  async function handleEval(formData: FormData) {
    "use server";
    await submitCoachEvaluationAction(formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Evaluations</h1>
        <p className="text-muted-foreground">Rate your attended sessions and view coach feedback</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate an Attended Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">All recent attended sessions have been evaluated.</p>
          ) : (
            pendingSessions.slice(0, 5).map((att) => (
              <form key={att.id} action={handleEval} className="rounded-md border p-4 space-y-3">
                <input type="hidden" name="sessionId" value={att.sessionId} />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {att.session.group.name} — Coach {att.session.coach.fullNameEn}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {att.session.scheduledStart.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select name="rating" defaultValue="5" className="h-9 rounded-md border bg-background px-3 text-sm">
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Needs Improvement</option>
                    <option value="1">1 — Poor</option>
                  </select>
                  <input
                    type="text"
                    name="comment"
                    placeholder="Optional feedback..."
                    className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-csk-gold px-4 text-xs font-semibold text-black hover:bg-csk-gold/90"
                  >
                    Submit Rating
                  </button>
                </div>
              </form>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coach Evaluations Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {detailedEvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No detailed evaluations recorded yet.</p>
          ) : (
            detailedEvals.map((ev) => (
              <div key={ev.id} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">By {ev.evaluator.fullNameEn}</span>
                  <Badge variant="outline">{ev.createdAt.toLocaleDateString()}</Badge>
                </div>
                {ev.summaryComment && <p className="text-muted-foreground">{ev.summaryComment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
