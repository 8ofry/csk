"use server";

import { revalidatePath } from "next/cache";
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
    revalidatePath("/head-coach/certificates");
    revalidatePath(`/trainee/certificates`);
    revalidatePath(`/coach/certificates`);
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
