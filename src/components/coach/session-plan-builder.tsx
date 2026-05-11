"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

export interface SessionPlanBuilderProps {
  defaultValues?: {
    groupId?: string;
    sessionDate?: string;
    units?: PlanItem[];
    notes?: string;
    isTemplate?: boolean;
    templateName?: string;
  };
  groups: { id: string; label: string }[];
  units: AvailableUnit[];
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function SessionPlanBuilder({
  defaultValues,
  groups,
  units,
  onSubmit,
  submitLabel,
}: SessionPlanBuilderProps) {
  const t = useTranslations("coachPlanBuilder");
  const router = useRouter();
  const [items, setItems] = useState<PlanItem[]>(defaultValues?.units ?? []);
  const [filter, setFilter] = useState("");
  const [isTemplate, setIsTemplate] = useState(defaultValues?.isTemplate ?? false);
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

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("units", JSON.stringify(items));
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(fd);
          if (result.error) setError(result.error);
          else router.push("/coach/session-plans");
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="groupId">{t("group")}</Label>
          <select
            id="groupId"
            name="groupId"
            required
            defaultValue={defaultValues?.groupId}
            disabled={isTemplate}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold disabled:opacity-50"
          >
            <option value="">{t("groupPlaceholder")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sessionDate">{t("sessionDate")}</Label>
          <Input
            id="sessionDate"
            name="sessionDate"
            type="datetime-local"
            required={!isTemplate}
            defaultValue={defaultValues?.sessionDate ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("templateLegend")}</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isTemplate"
            checked={isTemplate}
            onChange={(e) => setIsTemplate(e.target.checked)}
            className="h-4 w-4 accent-csk-gold"
          />
          {t("templateCheckbox")}
        </label>
        {isTemplate && (
          <div className="mt-3">
            <Label htmlFor="templateName">{t("templateName")}</Label>
            <Input
              id="templateName"
              name="templateName"
              defaultValue={defaultValues?.templateName ?? ""}
              className="mt-1"
              placeholder={t("templateNamePlaceholder")}
            />
          </div>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-6">
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
          <div className="max-h-96 overflow-y-auto rounded-md border">
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
                    <Button type="button" size="sm" variant="ghost" onClick={() => addUnit(u.id)}>
                      {t("addBtn")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">{t("sequenceTitle", { count: items.length })}</h3>
            <p className="text-xs text-muted-foreground">{t("sequenceHint")}</p>
          </div>
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("noUnitsYet")}
            </div>
          ) : (
            <ol className="space-y-2">
              {items.map((item, idx) => {
                const u = unitsById.get(item.trainingUnitId);
                return (
                  <li key={`${item.trainingUnitId}-${idx}`} className="rounded-md border p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                        >
                          ▲
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => move(idx, 1)}
                          disabled={idx === items.length - 1}
                        >
                          ▼
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {idx + 1}. {u?.nameEn ?? t("unknownUnit")}
                          </div>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeAt(idx)}>
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
                          />
                        </div>
                        <Textarea
                          placeholder={t("unitNotesPlaceholder")}
                          rows={2}
                          value={item.notes ?? ""}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })}
                          className="mt-2"
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

      <div>
        <Label htmlFor="notes">{t("planNotesLabel")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          className="mt-1"
        />
      </div>

      <input type="hidden" name="units" value={JSON.stringify(items)} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || items.length === 0}>
          {pending ? "..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
