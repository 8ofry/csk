import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { revalidateLocalized } from "@/lib/revalidate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InternSelfEvaluationPage() {
  const user = await requireRole("INTERN");

  const selfEvals = await prisma.detailedEvaluation.findMany({
    where: { evaluatorId: user.id, traineeId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  async function submitSelfEval(formData: FormData) {
    "use server";
    const actor = await requireRole("INTERN");
    const summary = String(formData.get("summary") ?? "").trim();
    const score = Number(formData.get("score") ?? 3);
    if (!summary) return;

    await prisma.detailedEvaluation.create({
      data: {
        traineeId: actor.id,
        evaluatorId: actor.id,
        period: "MONTHLY",
        bodyPartScores: {},
        skillScores: { selfRating: score },
        summaryComment: summary,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "intern.self_evaluation.create",
        entityType: "DetailedEvaluation",
      },
    });
    revalidateLocalized("/intern/self-evaluation");
    revalidateLocalized("/intern");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intern Self-Evaluation</h1>
        <p className="text-muted-foreground">Submit coaching reflections and track your progress</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Self-Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitSelfEval} className="space-y-3">
            <div>
              <label htmlFor="score" className="mb-1 block text-sm font-medium">
                Self-Rating (1–5)
              </label>
              <select
                id="score"
                name="score"
                defaultValue="4"
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="5">5 — Confident & Ready</option>
                <option value="4">4 — Progressing Well</option>
                <option value="3">3 — Developing</option>
                <option value="2">2 — Needs Mentorship</option>
                <option value="1">1 — Struggling</option>
              </select>
            </div>
            <div>
              <label htmlFor="summary" className="mb-1 block text-sm font-medium">
                Reflection & Key Takeaways
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={4}
                required
                placeholder="What drills did you assist with, and what will you improve next session?"
                className="w-full rounded-md border bg-background p-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-black hover:bg-csk-gold/90"
            >
              Submit Self-Evaluation
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous Reflections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selfEvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No self-evaluations submitted yet.</p>
          ) : (
            selfEvals.map((ev) => (
              <div key={ev.id} className="rounded-md border p-3 text-sm space-y-1">
                <div className="text-xs text-muted-foreground">
                  {ev.createdAt.toLocaleDateString()}
                </div>
                <p>{ev.summaryComment ?? "—"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
