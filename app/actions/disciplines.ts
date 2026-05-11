"use server";

import { revalidatePath } from "next/cache";
import {
  createDiscipline,
  disciplineInputSchema,
  updateDiscipline,
} from "@/application/disciplines/service";
import { requireRole } from "@/lib/auth-guard";

function parseFormData(fd: FormData) {
  return disciplineInputSchema.parse({
    nameAr: fd.get("nameAr") ?? "",
    nameEn: fd.get("nameEn") ?? "",
    category: fd.get("category") ?? "OTHER",
    skills: fd.get("skills") ?? "",
    active: fd.get("active") === "on" || fd.get("active") === "true",
  });
}

export async function createDisciplineAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parseFormData(formData);
    const created = await createDiscipline(data, user.id);
    revalidatePath("/admin/disciplines");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateDisciplineAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parseFormData(formData);
    await updateDiscipline(id, data, user.id);
    revalidatePath("/admin/disciplines");
    revalidatePath(`/admin/disciplines/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
