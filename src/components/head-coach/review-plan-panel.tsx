"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { reviewPlanAction } from "@/app/actions/session-plans";

interface AvailableUnit {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  difficulty: number;
  recommendedDurationSeconds: number | null;
  recommendedRounds: number | null;
}

interface PlanItem {
  trainingUnitId: string;
  durationOverrideSec?: number | null;
  roundsOverride?: number | null;
  notes?: string;
}

export interface ReviewPlanPanelProps {
  planId: string;
  defaultValues?: {
    units?: PlanItem[];
    notes?: string;
  };
  units: AvailableUnit[];
  labels: {
    approve: string;
    reject: string;
    cancelReject?: string;
    confirmReject?: string;
    rejectPlaceholder: string;
    shortCommentError: string;
  };
}

export function ReviewPlanPanel({
  planId,
  defaultValues,
  units,
  labels,
}: ReviewPlanPanelProps) {
  const t = useTranslations("coachPlanBuilder");
  const router = useRouter();
  const [items, setItems] = useState<PlanItem[]>(defaultValues?.units ?? []);
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unitsById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const filteredAvailable = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return units.filter((u) => {
      if (items.find((i) => i.trainingUnitId === u.id)) return false;
      if (!term) return true;
      return (
        u.nameEn.toLowerCase().includes(term) ||
        u.nameAr.toLowerCase().includes(term) ||
        u.category.toLowerCase().includes(term)
      );
    });
  }, [units, items, filter]);

  function addUnit(id: string) {
    setItems((prev) => [...prev, { trainingUnitId: id, notes: "" }]);
  }

  function removeAt(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }

  function updateItem(idx: number, patch: Partial<PlanItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  const handleReview = (action: "approve" | "reject") => {
    if (action === "reject" && comment.trim().length < 3) {
      setError(labels.shortCommentError);
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await reviewPlanAction(planId, action, items, notes, comment);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/head-coach/approvals");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Available Units */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">{t("availableTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("availableHint")}</p>
          </div>
          <Input
            type="search"
            placeholder={t("filterPlaceholder")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="max-h-96 overflow-y-auto rounded-md border bg-card">
            {filteredAvailable.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">{t("noMatches")}</div>
            ) : (
              <ul className="divide-y">
                {filteredAvailable.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.nameEn}</div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{u.category}</Badge>
                        <span>{"★".repeat(u.difficulty)}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addUnit(u.id)}
                      disabled={pending}
                    >
                      {t("addBtn")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Sequence */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">{t("sequenceTitle", { count: items.length })}</h3>
            <p className="text-xs text-muted-foreground">{t("sequenceHint")}</p>
          </div>
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground bg-card">
              {t("noUnitsYet")}
            </div>
          ) : (
            <ol className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const u = unitsById.get(item.trainingUnitId);
                return (
                  <li key={`${item.trainingUnitId}-${idx}`} className="rounded-md border p-3 bg-card">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0 || pending}
                          className="h-7 w-7"
                        >
                          ▲
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, 1)}
                          disabled={idx === items.length - 1 || pending}
                          className="h-7 w-7"
                        >
                          ▼
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate text-sm">
                            {idx + 1}. {u?.nameEn ?? t("unknownUnit")}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAt(idx)}
                            disabled={pending}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-7 text-xs"
                          >
                            {t("removeBtn")}
                          </Button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder={t("durationPlaceholder", {
                              seconds: u?.recommendedDurationSeconds ?? "—",
                            })}
                            value={item.durationOverrideSec ?? ""}
                            onChange={(e) =>
                              updateItem(idx, {
                                durationOverrideSec: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            disabled={pending}
                            className="h-8 text-xs"
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder={t("roundsPlaceholder", {
                              rounds: u?.recommendedRounds ?? "—",
                            })}
                            value={item.roundsOverride ?? ""}
                            onChange={(e) =>
                              updateItem(idx, {
                                roundsOverride: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            disabled={pending}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Textarea
                          placeholder={t("unitNotesPlaceholder")}
                          rows={2}
                          value={item.notes ?? ""}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })}
                          disabled={pending}
                          className="mt-2 text-xs"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Plan-wide notes */}
      <div>
        <Label htmlFor="planNotes" className="text-sm font-semibold">{t("planNotesLabel")}</Label>
        <Textarea
          id="planNotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for the plan..."
          disabled={pending}
          className="mt-1.5"
        />
      </div>

      {/* Comment/Feedback and Approval Actions */}
      <div className="rounded-md border p-4 bg-muted/20 space-y-4">
        <div>
          <Label htmlFor="reviewComment" className="text-sm font-semibold">Head Coach Comment / Feedback</Label>
          <Textarea
            id="reviewComment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={labels.rejectPlaceholder}
            disabled={pending}
            className="mt-1.5 bg-card"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleReview("approve")}
            disabled={pending || items.length === 0}
            className="bg-csk-gold text-csk-black hover:bg-csk-goldLight"
          >
            {pending ? "..." : labels.approve}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleReview("reject")}
            disabled={pending || items.length === 0}
          >
            {pending ? "..." : labels.reject}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
