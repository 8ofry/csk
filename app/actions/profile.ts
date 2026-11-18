"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { storage, validateUploadedFile } from "@/infrastructure/storage/storage";

export async function updateProfilePhotoAction(
  formData: FormData,
): Promise<{ ok?: true; photoUrl?: string | null; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const intent = formData.get("intent");
    if (intent === "remove") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { profilePhotoUrl: null },
      });
      revalidatePath("/", "layout");
      return { ok: true, photoUrl: null };
    }

    const file = formData.get("photo") as File | null;
    if (!file || file.size === 0) {
      return { error: "Please select an image file" };
    }
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files (PNG, JPG, WebP) are allowed" };
    }

    const validated = await validateUploadedFile(file, {
      maxBytes: 5 * 1024 * 1024,
    });
    const key = `${session.user.id}-${Date.now()}.${validated.ext}`;
    const stored = await storage.put({
      scope: "profile-photo",
      key,
      contentType: validated.contentType,
      data: validated.buffer,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePhotoUrl: stored.url },
    });

    revalidatePath("/", "layout");
    return { ok: true, photoUrl: stored.url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update profile image",
    };
  }
}
