"use server";

import { revalidatePath } from "next/cache";
import {
  GroupCapacityError,
  createGroup,
  endEnrollment,
  enrollTrainee,
  updateGroup,
} from "@/application/groups/service";
import { groupInputSchema, dayOfWeekSchema } from "@/application/groups/schemas";
import { requireRole } from "@/lib/auth-guard";

function parseFormData(fd: FormData) {
  const days = fd.getAll("days").map((d) => dayOfWeekSchema.parse(String(d)));
  return groupInputSchema.parse({
    name: fd.get("name") ?? "",
    locationId: fd.get("locationId") ?? "",
    disciplineId: fd.get("disciplineId") ?? "",
    primaryCoachId: fd.get("primaryCoachId") || null,
    internId: fd.get("internId") || null,
    levelBand: fd.get("levelBand") || null,
    ageBandMin: fd.get("ageBandMin") || null,
    ageBandMax: fd.get("ageBandMax") || null,
    schedule: {
      days,
      startTime: String(fd.get("startTime") ?? ""),
      endTime: String(fd.get("endTime") ?? ""),
    },
    capacity: fd.get("capacity") ?? 20,
    active: fd.get("active") === "on" || fd.get("active") === "true",
  });
}

export async function createGroupAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseFormData(formData);
    const created = await createGroup(data, user.id);
    revalidatePath("/head-coach/groups");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateGroupAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseFormData(formData);
    await updateGroup(id, data, user.id);
    revalidatePath("/head-coach/groups");
    revalidatePath(`/head-coach/groups/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function enrollTraineeAction(
  groupId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string; needsOverride?: true }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const traineeId = String(formData.get("traineeId") ?? "");
    const overrideCapacity = formData.get("overrideCapacity") === "on";
    if (!traineeId) return { error: "Pick a trainee" };
    await enrollTrainee({ groupId, traineeId, actorId: user.id, overrideCapacity });
    revalidatePath(`/head-coach/groups/${groupId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof GroupCapacityError) {
      return { error: e.message, needsOverride: true };
    }
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function endEnrollmentAction(
  enrollmentId: string,
  groupId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await endEnrollment({ enrollmentId, actorId: user.id });
    revalidatePath(`/head-coach/groups/${groupId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
