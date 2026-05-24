"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BodyMap, type BodyPartKey } from "@/components/evaluations/body-map";

export interface DetailedEvalFormProps {
  traineeId: string;
  traineeName: string;
  groupId: string;
  groupName: string;
  skills: string[];
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  redirectTo: string;
  svgContent?: string;
}

export function DetailedEvalForm({
  traineeId,
  traineeName,
  groupId,
  groupName,
  skills,
  onSubmit,
  redirectTo,
  svgContent,
}: DetailedEvalFormProps) {
  const t = useTranslations("detailedEval");
  const router = useRouter();
  const [bodyScores, setBodyScores] = useState<Partial<Record<BodyPartKey, number>>>({});
  const [bodyComments, setBodyComments] = useState<Partial<Record<BodyPartKey, string>>>({});
  const [skillScores, setSkillScores] = useState<Record<string, number>>({});
  const [skillComments, setSkillComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patchBody(key: BodyPartKey, patch: { score?: number; comment?: string }) {
    if (patch.score !== undefined) setBodyScores((p) => ({ ...p, [key]: patch.score }));
    if (patch.comment !== undefined) setBodyComments((p) => ({ ...p, [key]: patch.comment! }));
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        for (const [k, v] of Object.entries(bodyScores)) {
          if (v != null) fd.set(`body:score:${k}`, String(v));
        }
        for (const [k, v] of Object.entries(bodyComments)) {
          if (v) fd.set(`body:comment:${k}`, v);
        }
        for (const [k, v] of Object.entries(skillScores)) {
          if (v != null) fd.set(`skill:score:${k}`, String(v));
        }
        for (const [k, v] of Object.entries(skillComments)) {
          if (v) fd.set(`skill:comment:${k}`, v);
        }
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(fd);
          if (result.error) setError(result.error);
          else router.push(redirectTo as Parameters<typeof router.push>[0]);
        });
      }}
    >
      <input type="hidden" name="traineeId" value={traineeId} />
      <input type="hidden" name="contextGroupId" value={groupId} />

      <div className="rounded-md border bg-muted/30 p-4">
        <div className="text-sm">
          {t.rich("evaluatingHeader", {
            trainee: () => <strong>{traineeName}</strong>,
            group: () => <strong>{groupName}</strong>,
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="period">{t("cadenceLabel")}</Label>
        <select
          id="period"
          name="period"
          required
          className="mt-1 flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="WEEKLY">{t("cadenceWeekly")}</option>
          <option value="MONTHLY">{t("cadenceMonthly")}</option>
        </select>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t("bodyMapTitle")}</h2>
        <BodyMap scores={bodyScores} comments={bodyComments} onChange={patchBody} svgContent={svgContent} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t("skillsTitle")}</h2>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSkills")}</p>
        ) : (
          <ul className="space-y-3">
            {skills.map((skill) => (
              <li key={skill} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{skill.replace(/_/g, " ")}</span>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSkillScores((p) => ({ ...p, [skill]: n }))}
                        className={`h-8 w-8 rounded-md border text-xs ${
                          skillScores[skill] === n
                            ? "border-csk-gold bg-csk-gold/20 text-csk-gold"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  rows={2}
                  className="mt-2"
                  placeholder={t("skillCommentPlaceholder")}
                  value={skillComments[skill] ?? ""}
                  onChange={(e) => setSkillComments((p) => ({ ...p, [skill]: e.target.value }))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <Label htmlFor="summaryComment">{t("summaryComment")}</Label>
        <Textarea id="summaryComment" name="summaryComment" rows={4} className="mt-1" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "..." : t("saveEval")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
