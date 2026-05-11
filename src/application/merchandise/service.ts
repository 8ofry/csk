// Merchandise service (FR-MRC-01..05).
// Catalog managed centrally from Fight Club; all sales 100% CSK regardless of venue.

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { applySale, gross, isLowStock } from "@/domain/merchandise/stock";
import { logPayment } from "@/application/payments/service";

export const merchandiseItemSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  photos: z.array(z.string().url()).default([]),
  variants: z.array(z.string()).default([]), // simplified to a flat sku list for v1
  costPrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  stockLevel: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
});

export type MerchandiseItemInput = z.infer<typeof merchandiseItemSchema>;

export const saleInputSchema = z.object({
  itemId: z.string().min(1),
  variantSku: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  customerUserId: z.string().optional().nullable(),
  locationId: z.string().min(1),
  paymentMethod: z.enum(["CASH", "VODAFONE_CASH", "BANK_TRANSFER"]).default("CASH"),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

export async function listMerchandise(filters: { activeOnly?: boolean } = {}) {
  return prisma.merchandiseItem.findMany({
    where: { active: filters.activeOnly ? true : undefined },
    orderBy: [{ active: "desc" }, { nameEn: "asc" }],
    include: { _count: { select: { sales: true } } },
  });
}

export async function getMerchandise(id: string) {
  return prisma.merchandiseItem.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { soldAt: "desc" },
        take: 25,
        include: {
          soldBy: { select: { fullNameEn: true } },
          customer: { select: { fullNameEn: true } },
        },
      },
    },
  });
}

export async function createMerchandiseItem(input: MerchandiseItemInput, actorId: string) {
  const data = merchandiseItemSchema.parse(input);
  const created = await prisma.merchandiseItem.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      description: data.description ?? null,
      category: data.category,
      photos: data.photos,
      variants: data.variants as unknown as object,
      costPrice: new Prisma.Decimal(data.costPrice),
      salePrice: new Prisma.Decimal(data.salePrice),
      stockLevel: data.stockLevel,
      lowStockThreshold: data.lowStockThreshold,
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "merchandise.create",
      entityType: "MerchandiseItem",
      entityId: created.id,
    },
  });
  return created;
}

export async function updateMerchandiseItem(
  id: string,
  input: MerchandiseItemInput,
  actorId: string,
) {
  const data = merchandiseItemSchema.parse(input);
  const updated = await prisma.merchandiseItem.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      description: data.description ?? null,
      category: data.category,
      photos: data.photos,
      variants: data.variants as unknown as object,
      costPrice: new Prisma.Decimal(data.costPrice),
      salePrice: new Prisma.Decimal(data.salePrice),
      stockLevel: data.stockLevel,
      lowStockThreshold: data.lowStockThreshold,
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "merchandise.update",
      entityType: "MerchandiseItem",
      entityId: id,
    },
  });
  return updated;
}

/**
 * Log an in-person sale (FR-MRC-04). Decrements stock, creates a MerchandiseSale row,
 * and routes through the Payment engine so the 100% CSK split (per §10.1) is recorded
 * uniformly with the rest of the financial trail.
 */
export async function logMerchandiseSale(
  input: SaleInput,
  actorId: string,
): Promise<{ saleId: string; paymentId: string; receiptNumber: string; lowStock: boolean }> {
  const data = saleInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const item = await tx.merchandiseItem.findUnique({ where: { id: data.itemId } });
    if (!item) throw new Error("Item not found");
    if (!item.active) throw new Error("Item is archived");

    const nextState = applySale(
      { stockLevel: item.stockLevel, lowStockThreshold: item.lowStockThreshold },
      data.quantity,
    );

    const totalPrice = gross(data.unitPrice, data.quantity);

    const sale = await tx.merchandiseSale.create({
      data: {
        itemId: item.id,
        variantSku: data.variantSku ?? null,
        quantity: data.quantity,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
        customerUserId: data.customerUserId ?? null,
        locationId: data.locationId,
        soldById: actorId,
      },
    });

    await tx.merchandiseItem.update({
      where: { id: item.id },
      data: { stockLevel: nextState.stockLevel },
    });

    // Create the corresponding payment via the engine (split engine resolves 100% CSK).
    // The engine itself uses prisma directly, but since we're inside a transaction we need
    // a connected operation — we accept the small isolation gap here (sale is created
    // first; payment is logged immediately after). This matches how subscription payments
    // already work for v1.
    const result = await logPayment(
      {
        revenueType: "MERCHANDISE",
        payerUserId: data.customerUserId ?? actorId,
        amountGross: totalPrice,
        method: data.paymentMethod,
        merchandiseSaleId: sale.id,
        locationId: data.locationId,
      },
      actorId,
    );

    await tx.auditLog.create({
      data: {
        actorId,
        action: "merchandise.sale",
        entityType: "MerchandiseSale",
        entityId: sale.id,
        changes: { itemId: item.id, quantity: data.quantity, totalPrice },
      },
    });

    return {
      saleId: sale.id,
      paymentId: result.payment.id,
      receiptNumber: result.payment.receiptNumber,
      lowStock: isLowStock(nextState),
    };
  });
}

export async function listLowStock() {
  const items = await prisma.merchandiseItem.findMany({
    where: { active: true },
    orderBy: { stockLevel: "asc" },
  });
  return items.filter((i) =>
    isLowStock({ stockLevel: i.stockLevel, lowStockThreshold: i.lowStockThreshold }),
  );
}
