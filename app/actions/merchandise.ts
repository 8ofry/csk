"use server";

import { revalidatePath } from "next/cache";
import {
  createMerchandiseItem,
  logMerchandiseSale,
  merchandiseItemSchema,
  saleInputSchema,
  updateMerchandiseItem,
} from "@/application/merchandise/service";
import { requireRole } from "@/lib/auth-guard";

function parseItem(formData: FormData) {
  return merchandiseItemSchema.parse({
    nameAr: formData.get("nameAr") ?? "",
    nameEn: formData.get("nameEn") ?? "",
    description: formData.get("description") || null,
    category: formData.get("category") ?? "other",
    photos: parseList(formData.get("photos")),
    variants: parseList(formData.get("variants")),
    costPrice: formData.get("costPrice") ?? 0,
    salePrice: formData.get("salePrice") ?? 0,
    stockLevel: formData.get("stockLevel") ?? 0,
    lowStockThreshold: formData.get("lowStockThreshold") ?? 5,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
}

export async function createMerchandiseAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseItem(formData);
    const created = await createMerchandiseItem(data, user.id);
    revalidatePath("/head-coach/merchandise");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateMerchandiseAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseItem(formData);
    await updateMerchandiseItem(id, data, user.id);
    revalidatePath("/head-coach/merchandise");
    revalidatePath(`/head-coach/merchandise/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function logSaleAction(
  formData: FormData,
): Promise<{ ok?: true; receiptNumber?: string; lowStock?: boolean; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = saleInputSchema.parse({
      itemId: formData.get("itemId"),
      variantSku: formData.get("variantSku") || null,
      quantity: formData.get("quantity") ?? 1,
      unitPrice: formData.get("unitPrice") ?? 0,
      customerUserId: formData.get("customerUserId") || null,
      locationId: formData.get("locationId"),
      paymentMethod: formData.get("paymentMethod") ?? "CASH",
    });
    const result = await logMerchandiseSale(data, user.id);
    revalidatePath("/head-coach/merchandise");
    revalidatePath(`/head-coach/merchandise/${data.itemId}`);
    return { ok: true, receiptNumber: result.receiptNumber, lowStock: result.lowStock };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function parseList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
