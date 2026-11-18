"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import {
  issueCertificate,
  issueCertificateSchema,
} from "@/application/certificates/service";
import { requireRole } from "@/lib/auth-guard";

export async function issueCertificateAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = issueCertificateSchema.parse({
      recipientId: formData.get("recipientId"),
      awardType: formData.get("awardType"),
      groupId: formData.get("groupId") || null,
      periodYear: formData.get("periodYear"),
      periodMonth: formData.get("periodMonth"),
      narrative: formData.get("narrative"),
      pdfUrl: formData.get("pdfUrl") || null,
    });
    const created = await issueCertificate(data, user.id);
    revalidateLocalized("/head-coach/certificates");
    revalidateLocalized(`/trainee/certificates`);
    revalidateLocalized(`/coach/certificates`);
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
