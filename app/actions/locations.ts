"use server";

import { revalidatePath } from "next/cache";
import {
  archiveLocation,
  createLocation,
  updateLocation,
} from "@/application/locations/service";
import { locationInputSchema } from "@/application/locations/schemas";
import { requireRole } from "@/lib/auth-guard";

function parseFormData(fd: FormData) {
  return locationInputSchema.parse({
    nameAr: fd.get("nameAr") ?? "",
    nameEn: fd.get("nameEn") ?? "",
    district: fd.get("district") ?? "",
    address: fd.get("address") ?? "",
    latitude: fd.get("latitude") ?? "",
    longitude: fd.get("longitude") ?? "",
    ownership: fd.get("ownership") ?? "PARTNER",
    contactPerson: fd.get("contactPerson") ?? null,
    contactPhone: fd.get("contactPhone") ?? null,
    active: fd.get("active") === "on" || fd.get("active") === "true",
  });
}

export async function createLocationAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parseFormData(formData);
    const created = await createLocation(data, user.id);
    revalidatePath("/admin/locations");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateLocationAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parseFormData(formData);
    await updateLocation(id, data, user.id);
    revalidatePath("/admin/locations");
    revalidatePath(`/admin/locations/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function archiveLocationAction(id: string): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    await archiveLocation(id, user.id);
    revalidatePath("/admin/locations");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
