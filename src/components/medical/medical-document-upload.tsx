"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DocUploadProps {
  traineeId: string;
  onSubmit: (
    traineeId: string,
    formData: FormData,
  ) => Promise<{ ok?: true; id?: string; error?: string }>;
}

export function MedicalDocumentUpload({ traineeId, onSubmit }: DocUploadProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(traineeId, fd);
          if (result.error) setError(result.error);
          else {
            (e.currentTarget as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div>
        <Label htmlFor="documentType">Type</Label>
        <select
          id="documentType"
          name="documentType"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="CLEARANCE">Medical clearance</option>
          <option value="ECG">ECG</option>
          <option value="BLOOD">Blood work</option>
          <option value="VISION">Vision test</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div>
        <Label htmlFor="fileUrl">Document URL (https)</Label>
        <Input
          id="fileUrl"
          name="fileUrl"
          type="url"
          required
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="issueDate">Issue date</Label>
        <Input id="issueDate" name="issueDate" type="date" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="expiryDate">Expiry date</Label>
        <Input id="expiryDate" name="expiryDate" type="date" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="issuingDoctor">Issuing doctor (optional)</Label>
        <Input id="issuingDoctor" name="issuingDoctor" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" className="mt-1" />
      </div>
      {error && <p className="col-span-full text-sm text-destructive">{error}</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Add document"}
        </Button>
      </div>
    </form>
  );
}
