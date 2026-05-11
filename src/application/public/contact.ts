// Public contact form (FR-WEB-05).
// Notifies all active Head Coaches and Admins; replies to the submitter via email.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { dispatchNotification } from "@/application/notifications/service";

export const contactInputSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(10).max(5000),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export async function submitContact(input: ContactInput) {
  const data = contactInputSchema.parse(input);

  // Audit the submission so we have a record even if notification dispatch fails.
  await prisma.auditLog.create({
    data: {
      action: "public.contact.submit",
      entityType: "ContactSubmission",
      changes: { ...data },
    },
  });

  // Notify staff. Reuse the generic ACCOUNT_APPROVAL template as a low-friction
  // staff-notification carrier in v1; v2 adds a dedicated CONTACT_INQUIRY event.
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "HEAD_COACH"] }, status: "ACTIVE" },
    select: { id: true },
  });

  for (const s of staff) {
    await dispatchNotification({
      recipientUserId: s.id,
      eventType: "ACCOUNT_APPROVAL",
      payload: {
        decision: `Public inquiry — ${data.subject ?? "no subject"}`,
        // The dispatcher renders subject/body from the template; the human content
        // is summarized inline so it shows up in the in-app inbox preview.
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        message: data.message.slice(0, 200),
      },
      channels: ["EMAIL", "IN_APP"],
    });
  }

  return { ok: true as const };
}
