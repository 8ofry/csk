"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  approveDailyReportAction,
  rejectDailyReportAction,
} from "@/app/actions/daily-reports";

export interface DailyReportActionsLabels {
  approveDeliver: string;
  reject: string;
  cancelReject: string;
  confirmReject: string;
  rejectPlaceholder: string;
  shortCommentError: string;
}

export function DailyReportActions({
  reportId,
  labels,
}: {
  reportId: string;
  labels: DailyReportActionsLabels;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);

  function approve() {
    startTransition(async () => {
      setError(null);
      const r = await approveDailyReportAction(reportId);
      if (r.error) setError(r.error);
      else router.push("/head-coach/approvals");
    });
  }

  function reject() {
    if (comment.trim().length < 3) {
      setError(labels.shortCommentError);
      return;
    }
    startTransition(async () => {
      setError(null);
      const r = await rejectDailyReportAction(reportId, comment);
      if (r.error) setError(r.error);
      else router.push("/head-coach/approvals");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={approve} disabled={pending}>
          {labels.approveDeliver}
        </Button>
        <Button variant="outline" onClick={() => setShowReject((s) => !s)}>
          {showReject ? labels.cancelReject : labels.reject}
        </Button>
      </div>
      {showReject && (
        <div className="space-y-2 rounded-md border p-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={labels.rejectPlaceholder}
            rows={3}
          />
          <Button variant="destructive" onClick={reject} disabled={pending}>
            {labels.confirmReject}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
