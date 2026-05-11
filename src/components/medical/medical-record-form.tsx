"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MedicalRecordFormProps {
  traineeId: string;
  defaultValues?: {
    bloodType?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    currentMedications?: string | null;
    primaryPhysicianName?: string | null;
    primaryPhysicianPhone?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactRelation?: string | null;
  };
  onSubmit: (
    traineeId: string,
    formData: FormData,
  ) => Promise<{ ok?: true; error?: string }>;
}

export function MedicalRecordForm({ traineeId, defaultValues, onSubmit }: MedicalRecordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(traineeId, fd);
          if (result.error) setError(result.error);
          else setSavedAt(new Date());
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bloodType">Blood type</Label>
          <Input
            id="bloodType"
            name="bloodType"
            defaultValue={defaultValues?.bloodType ?? ""}
            placeholder="e.g. O+"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="primaryPhysicianName">Primary physician</Label>
          <Input
            id="primaryPhysicianName"
            name="primaryPhysicianName"
            defaultValue={defaultValues?.primaryPhysicianName ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="primaryPhysicianPhone">Physician phone</Label>
        <Input
          id="primaryPhysicianPhone"
          name="primaryPhysicianPhone"
          defaultValue={defaultValues?.primaryPhysicianPhone ?? ""}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          name="allergies"
          defaultValue={defaultValues?.allergies ?? ""}
          rows={2}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="chronicConditions">Chronic conditions</Label>
        <Textarea
          id="chronicConditions"
          name="chronicConditions"
          defaultValue={defaultValues?.chronicConditions ?? ""}
          rows={2}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="currentMedications">Current medications</Label>
        <Textarea
          id="currentMedications"
          name="currentMedications"
          defaultValue={defaultValues?.currentMedications ?? ""}
          rows={2}
          className="mt-1"
        />
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">Emergency contact</legend>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="emergencyContactName">Name</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={defaultValues?.emergencyContactName ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              defaultValue={defaultValues?.emergencyContactPhone ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactRelation">Relation</Label>
            <Input
              id="emergencyContactRelation"
              name="emergencyContactRelation"
              defaultValue={defaultValues?.emergencyContactRelation ?? ""}
              placeholder="e.g. parent"
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Save"}
        </Button>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </form>
  );
}
