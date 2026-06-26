import { z } from "zod";
import { UserRole, AccountStatus } from "@prisma/client";

export const userCreateInputSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  fullNameEn: z.string().min(2, "English name required"),
  phone: z.string().min(7, "Phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")), // Optional password for manual creation
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(AccountStatus).default("ACTIVE"),
  parentManaged: z.boolean().default(false),
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;

export const userUpdateInputSchema = z.object({
  fullNameAr: z.string().min(2, "الاسم بالعربي مطلوب"),
  fullNameEn: z.string().min(2, "English name required"),
  phone: z.string().min(7, "Phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")), // Optional password change
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(AccountStatus),
  parentManaged: z.boolean().default(false),
});

export type UserUpdateInput = z.infer<typeof userUpdateInputSchema>;
