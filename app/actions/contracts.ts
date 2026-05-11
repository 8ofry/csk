"use server";

import { revalidatePath } from "next/cache";
import {
  archiveContract,
  contractInputSchema,
  createContract,
  updateContract,
} from "@/application/contracts/service";
import { requireRole } from "@/lib/auth-guard";

function parse(formData: FormData) {
  const get = (k: string) => formData.get(k) || null;
  return contractInputSchema.parse({
    coachId: formData.get("coachId"),
    locationId: get("locationId"),
    disciplineId: get("disciplineId"),
    subscriptionPercent: get("subscriptionPercent"),
    privateSessionPercent: get("privateSessionPercent"),
    privateSessionFixedRate: get("privateSessionFixedRate"),
    beltExamPercent: get("beltExamPercent"),
    championshipPercent: get("championshipPercent"),
    effectiveFrom: get("effectiveFrom"),
    effectiveTo: get("effectiveTo"),
    notes: get("notes"),
  });
}

export async function createContractAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parse(formData);
    const created = await createContract(data, user.id);
    revalidatePath("/admin/contracts");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateContractAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    const data = parse(formData);
    await updateContract(id, data, user.id);
    revalidatePath("/admin/contracts");
    revalidatePath(`/admin/contracts/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function archiveContractAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    await archiveContract(id, user.id);
    revalidatePath("/admin/contracts");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
