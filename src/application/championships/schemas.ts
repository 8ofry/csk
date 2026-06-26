import { z } from "zod";
import { Gender, FightClass } from "@prisma/client";

export const externalSignupSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  fullNameEn: z.string().min(2, "English name required"),
  phone: z.string().min(7, "Phone number required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  academyNameAr: z.string().min(2, "اسم الأكاديمية بالعربي مطلوب"),
  academyNameEn: z.string().min(2, "Academy name in English required"),
});

export type ExternalSignupInput = z.infer<typeof externalSignupSchema>;

export const fighterRegisterSchema = z.object({
  championshipId: z.string().min(1),
  fullNameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  fullNameEn: z.string().min(2, "English name required"),
  phone: z.string().min(7, "Phone number required"),
  gender: z.nativeEnum(Gender),
  dob: z.coerce.date(),
  weightKg: z.coerce.number().min(20, "Invalid weight").max(200),
  fightClass: z.nativeEnum(FightClass),
  photoUrl: z.string().optional().nullable(),
});

export type FighterRegisterInput = z.infer<typeof fighterRegisterSchema>;

export const instapayPaymentSchema = z.object({
  registrationId: z.string().min(1),
  instapayRef: z.string().min(3, "Reference number required"),
  paymentReceiptUrl: z.string().optional().nullable(),
});

export type InstapayPaymentInput = z.infer<typeof instapayPaymentSchema>;

export const matchResultSchema = z.object({
  matchId: z.string().min(1),
  outcome: z.enum(["WIN", "LOSS", "DRAW", "NO_CONTEST"]),
  method: z.enum(["KO", "TKO", "DECISION", "SUBMISSION", "DQ", "OTHER"]).optional().nullable(),
  round: z.coerce.number().int().min(1).max(20).optional().nullable(),
  timeInRound: z.string().optional().nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  notes: z.string().optional().nullable(),
  winnerId: z.string().optional().nullable(),
});

export type MatchResultInput = z.infer<typeof matchResultSchema>;
