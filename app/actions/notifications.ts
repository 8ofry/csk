"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  markAllRead,
  preferencesSchema,
  setPreferences,
} from "@/application/notifications/inbox";

export async function markAllReadAction(): Promise<{ ok?: true; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };
  await markAllRead(session.user.id);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function savePreferencesAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Not signed in" };
    const optedOut = formData.getAll("optedOut").map(String);
    const data = preferencesSchema.parse({ optedOut });
    await setPreferences(session.user.id, data);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
