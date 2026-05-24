"use server";

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

const quickAddTraineeSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  fullNameEn: z.string().min(2, "English name required"),
  phone: z.string().min(7, "Phone number required"),
  parentManaged: z.boolean().default(false),
});

/**
 * Quick-add a trainee by staff (Head Coach).
 * Creates an ACTIVE account using phone as the primary identifier.
 * A placeholder email is generated — the trainee can update it later.
 */
export async function quickAddTraineeAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    await requireRole("HEAD_COACH");

    const parsed = quickAddTraineeSchema.safeParse({
      fullNameAr: formData.get("fullNameAr"),
      fullNameEn: formData.get("fullNameEn"),
      phone: String(formData.get("phone") ?? "").replace(/\s+/g, ""),
      parentManaged: formData.get("parentManaged") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const { fullNameAr, fullNameEn, phone, parentManaged } = parsed.data;

    // Generate a placeholder email from the phone (unique, staff-created accounts only)
    const placeholderEmail = `${phone.replace(/[^0-9]/g, "")}@phone.csk.local`;

    const trainee = await prisma.user.create({
      data: {
        role: "TRAINEE",
        email: placeholderEmail,
        phone,
        passwordHash: "", // No password — staff-created; login via OTP later
        fullNameAr,
        fullNameEn,
        status: "ACTIVE", // Bypass normal approval flow for staff-created accounts
        preferredLocale: "AR",
        parentManaged,
      },
    });

    revalidatePath("/head-coach/trainees");
    return { ok: true, id: trainee.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A trainee with this phone number already exists." };
    }
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
