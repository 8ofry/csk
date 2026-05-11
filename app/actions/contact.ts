"use server";

import { contactInputSchema, submitContact } from "@/application/public/contact";

export async function submitContactAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const data = contactInputSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || null,
      subject: formData.get("subject") || null,
      message: formData.get("message"),
    });
    await submitContact(data);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
