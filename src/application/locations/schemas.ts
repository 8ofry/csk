import { z } from "zod";

export const ownershipSchema = z.enum(["CSK_OWNED", "PARTNER", "PATRONAGE"]);

export const openingHoursSchema = z.object({
  mon: z.string().optional(),
  tue: z.string().optional(),
  wed: z.string().optional(),
  thu: z.string().optional(),
  fri: z.string().optional(),
  sat: z.string().optional(),
  sun: z.string().optional(),
});

export const locationInputSchema = z.object({
  nameAr: z.string().min(2, "Arabic name required"),
  nameEn: z.string().min(2, "English name required"),
  district: z.string().min(2),
  address: z.string().min(2),
  latitude: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? null : Number(v)))
    .nullable()
    .optional(),
  longitude: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === undefined ? null : Number(v)))
    .nullable()
    .optional(),
  ownership: ownershipSchema,
  contactPerson: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  openingHours: openingHoursSchema.optional().nullable(),
  active: z.boolean().default(true),
});

export type LocationInput = z.infer<typeof locationInputSchema>;
