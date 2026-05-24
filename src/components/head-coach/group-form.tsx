"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAY_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;

interface OptionList {
  id: string;
  label: string;
}

export interface GroupFormProps {
  defaultValues?: {
    name?: string;
    locationId?: string;
    disciplineId?: string;
    primaryCoachId?: string | null;
    internId?: string | null;
    levelBand?: string | null;
    levelBands?: string[];
    coaches?: { coachId: string; levels: string[] }[];
    interns?: string[];
    ageBandMin?: number | null;
    ageBandMax?: number | null;
    schedule?: { days?: string[]; startTime?: string; endTime?: string };
    capacity?: number;
    active?: boolean;
  };
  locations: OptionList[];
  disciplines: OptionList[];
  coaches: OptionList[];
  interns: OptionList[];
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function GroupForm({
  defaultValues,
  locations,
  disciplines,
  coaches,
  interns,
  onSubmit,
  submitLabel,
}: GroupFormProps) {
  const t = useTranslations("hcGroupForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initialDays = new Set(defaultValues?.schedule?.days ?? []);

  // Initialize level bands from levelBands array or fallback to legacy levelBand
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    defaultValues?.levelBands ?? (defaultValues?.levelBand ? [defaultValues.levelBand] : ["N"])
  );

  // Initialize coaches from coaches assignments array or fallback to legacy primaryCoachId
  const [selectedCoaches, setSelectedCoaches] = useState<{ coachId: string; levels: string[] }[]>(
    defaultValues?.coaches ??
      (defaultValues?.primaryCoachId
        ? [{ coachId: defaultValues.primaryCoachId, levels: defaultValues?.levelBands ?? ["N"] }]
        : [])
  );

  // Initialize interns from interns array or fallback to legacy internId
  const [selectedInterns, setSelectedInterns] = useState<string[]>(
    defaultValues?.interns ?? (defaultValues?.internId ? [defaultValues.internId] : [])
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        
        // Append selected level bands
        selectedLevels.forEach((lvl) => {
          fd.append("levelBands", lvl);
        });

        // Append selected interns
        selectedInterns.forEach((iId) => {
          fd.append("interns", iId);
        });

        startTransition(async () => {
          setError(null);
          const result = await onSubmit(fd);
          if (result.error) setError(result.error);
          else router.push("/head-coach/groups");
        });
      }}
    >
      <div>
        <Label htmlFor="name">{t("groupName")}</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder={t("groupNamePlaceholder")}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="locationId">{t("location")}</Label>
          <SelectField
            id="locationId"
            name="locationId"
            defaultValue={defaultValues?.locationId}
            options={locations}
            required
          />
        </div>
        <div>
          <Label htmlFor="disciplineId">{t("discipline")}</Label>
          <SelectField
            id="disciplineId"
            name="disciplineId"
            defaultValue={defaultValues?.disciplineId}
            options={disciplines}
            required
          />
        </div>
      </div>

      {/* Multi-Level Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("levelBands") ?? "Group Levels"}</Label>
        <div className="flex flex-wrap gap-2">
          {["N", "A", "B", "C"].map((lvl) => {
            const isChecked = selectedLevels.includes(lvl);
            return (
              <label
                key={lvl}
                className="flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10 transition-all hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  value={lvl}
                  checked={isChecked}
                  onChange={(e) => {
                    let next: string[];
                    if (e.target.checked) {
                      next = [...selectedLevels, lvl];
                    } else {
                      next = selectedLevels.filter((l) => l !== lvl);
                    }
                    setSelectedLevels(next);

                    // Adjust each coach's assigned levels so they don't contain any removed level
                    setSelectedCoaches(
                      selectedCoaches.map((sc) => ({
                        ...sc,
                        levels: sc.levels.filter((l) => next.includes(l)),
                      }))
                    );
                  }}
                  className="h-4 w-4 accent-csk-gold"
                />
                <span>{lvl === "N" ? (t("newbie") ?? "N") : lvl}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Coaches Selection with Assignment Level Matrix */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("coaches") ?? "Coaches & Levels Matrix"}</Label>
        <div className="space-y-3 rounded-md border p-4 bg-muted/10">
          {coaches.map((c) => {
            const coachAssignment = selectedCoaches.find((sc) => sc.coachId === c.id);
            const isCoachChecked = !!coachAssignment;

            return (
              <div key={c.id} className="border-b border-muted/50 pb-3 last:border-b-0 last:pb-0">
                <label className="flex cursor-pointer items-center gap-2 font-medium text-sm">
                  <input
                    type="checkbox"
                    checked={isCoachChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCoaches([
                          ...selectedCoaches,
                          { coachId: c.id, levels: [...selectedLevels] }, // Default to all selected levels
                        ]);
                      } else {
                        setSelectedCoaches(selectedCoaches.filter((sc) => sc.coachId !== c.id));
                      }
                    }}
                    className="h-4 w-4 accent-csk-gold"
                  />
                  <span className="text-foreground">{c.label}</span>
                </label>

                {isCoachChecked && (
                  <div className="mt-2 ml-6 pl-3 border-l-2 border-csk-gold/40 space-y-1">
                    <span className="text-xs text-muted-foreground block font-medium">
                      {t("assignLevelsToCoach") ?? "Assign Levels for this Coach:"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedLevels.map((lvl) => {
                        const isLvlChecked = coachAssignment.levels.includes(lvl);
                        return (
                          <label
                            key={lvl}
                            className="flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-xs has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/15 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={isLvlChecked}
                              onChange={(e) => {
                                let nextLevels: string[];
                                if (e.target.checked) {
                                  nextLevels = [...coachAssignment.levels, lvl];
                                } else {
                                  nextLevels = coachAssignment.levels.filter((l) => l !== lvl);
                                }
                                setSelectedCoaches(
                                  selectedCoaches.map((sc) =>
                                    sc.coachId === c.id ? { ...sc, levels: nextLevels } : sc
                                  )
                                );
                              }}
                              className="h-3.5 w-3.5 accent-csk-gold"
                            />
                            <span>{lvl === "N" ? (t("newbie") ?? "N") : lvl}</span>
                          </label>
                        );
                      })}
                      {selectedLevels.length === 0 && (
                        <span className="text-xs text-destructive font-medium">
                          {t("pleaseSelectLevelsFirst") ?? "Choose group levels first"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {coaches.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No coaches available
            </span>
          )}
        </div>
        {/* Hidden input field storing the stringified JSON array of coach-level mappings */}
        <input type="hidden" name="coachesJson" value={JSON.stringify(selectedCoaches)} />
      </div>

      {/* Interns Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("internOpt") ?? "Interns"}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md border p-4 bg-muted/10">
          {interns.map((i) => {
            const isChecked = selectedInterns.includes(i.id);
            return (
              <label
                key={i.id}
                className="flex cursor-pointer items-center gap-2 text-sm p-1 rounded hover:bg-muted/30 transition-all"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInterns([...selectedInterns, i.id]);
                    } else {
                      setSelectedInterns(selectedInterns.filter((id) => id !== i.id));
                    }
                  }}
                  className="h-4 w-4 accent-csk-gold"
                />
                <span>{i.label}</span>
              </label>
            );
          })}
          {interns.length === 0 && (
            <span className="text-xs text-muted-foreground py-2">
              {t("none") ?? "No interns available"}
            </span>
          )}
        </div>
      </div>

      {/* Weekly Schedule Section */}
      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("weeklySchedule")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10 transition-all hover:bg-muted/40"
            >
              <input
                type="checkbox"
                name="days"
                value={key}
                defaultChecked={initialDays.has(key)}
                className="h-4 w-4 accent-csk-gold"
              />
              {t(`days.${key}`)}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">{t("startTime")}</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={defaultValues?.schedule?.startTime ?? "18:00"}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endTime">{t("endTime")}</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={defaultValues?.schedule?.endTime ?? "19:30"}
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ageBandMin">{t("ageMin")}</Label>
          <Input
            id="ageBandMin"
            name="ageBandMin"
            type="number"
            min={0}
            max={120}
            defaultValue={defaultValues?.ageBandMin ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ageBandMax">{t("ageMax")}</Label>
          <Input
            id="ageBandMax"
            name="ageBandMax"
            type="number"
            min={0}
            max={120}
            defaultValue={defaultValues?.ageBandMax ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacity">
            {t("capacity")}{" "}
            <span className="text-xs text-muted-foreground">{t("capacityHint")}</span>
          </Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={defaultValues?.capacity ?? 20}
            className="mt-1"
          />
        </div>
        <label className="flex items-end gap-2 text-sm cursor-pointer pb-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active ?? true}
            className="h-4 w-4 rounded border-input accent-csk-gold"
          />
          {t("active")}
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  id,
  name,
  defaultValue,
  options,
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  options: OptionList[];
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue}
      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
