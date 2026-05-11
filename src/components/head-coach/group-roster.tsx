"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { endEnrollmentAction, enrollTraineeAction } from "@/app/actions/groups";

export interface GroupRosterProps {
  groupId: string;
  atCapacity: boolean;
  enrollments: {
    id: string;
    traineeId: string;
    fullNameEn: string;
    fullNameAr: string;
    startDate: string;
  }[];
  availableTrainees: { id: string; label: string }[];
}

export function GroupRoster({ groupId, atCapacity, enrollments, availableTrainees }: GroupRosterProps) {
  const t = useTranslations("hcGroupRoster");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsOverride, setNeedsOverride] = useState(false);

  const enrollSubmit = (formData: FormData) => {
    const enroll = enrollTraineeAction.bind(null, groupId);
    startTransition(async () => {
      setError(null);
      const result = await enroll(formData);
      if (result.error) {
        setError(result.error);
        setNeedsOverride(!!result.needsOverride);
      } else {
        setNeedsOverride(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        action={enrollSubmit}
      >
        <div className="flex-1 min-w-64">
          <label className="mb-1 block text-sm font-medium">{t("addTrainee")}</label>
          <select
            name="traineeId"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">{t("chooseTrainee")}</option>
            {availableTrainees.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.label}
              </option>
            ))}
          </select>
        </div>

        {(atCapacity || needsOverride) && (
          <label className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <input type="checkbox" name="overrideCapacity" className="h-4 w-4 accent-csk-gold" />
            {t("overrideCapacity")}
          </label>
        )}

        <Button type="submit" disabled={pending || availableTrainees.length === 0}>
          {pending ? "..." : t("enroll")}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("trainee")}</TableHead>
            <TableHead>{t("enrolledSince")}</TableHead>
            <TableHead className="text-end">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
          {enrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="font-medium">{e.fullNameEn}</div>
                <div className="text-xs text-muted-foreground">{e.fullNameAr}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{e.startDate.slice(0, 10)}</Badge>
              </TableCell>
              <TableCell className="text-end">
                <UnenrollButton enrollmentId={e.id} groupId={groupId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UnenrollButton({ enrollmentId, groupId }: { enrollmentId: string; groupId: string }) {
  const t = useTranslations("hcGroupRoster");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("endConfirm"))) return;
        startTransition(async () => {
          await endEnrollmentAction(enrollmentId, groupId);
        });
      }}
    >
      {t("endEnrollment")}
    </Button>
  );
}
