import { z } from "zod";

export const dayOfWeekSchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM (24-hour)");

export const weeklyScheduleSchema = z.object({
  days: z.array(dayOfWeekSchema).min(1, "Pick at least one day"),
  startTime: timeSchema,
  endTime: timeSchema,
});

export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;

export const levelBandSchema = z.enum(["N", "A", "B", "C"]);

export const groupInputSchema = z.object({
  name: z.string().min(2),
  locationId: z.string().min(1),
  disciplineId: z.string().min(1),
  levelBands: z.array(levelBandSchema).min(1, "Pick at least one level"),
  coaches: z.array(
    z.object({
      coachId: z.string().min(1),
      levels: z.array(levelBandSchema),
    })
  ).min(1, "Assign at least one coach"),
  interns: z.array(z.string()).default([]),
  ageBandMin: z.coerce.number().int().min(0).max(120).nullable().optional(),
  ageBandMax: z.coerce.number().int().min(0).max(120).nullable().optional(),
  schedule: weeklyScheduleSchema,
  capacity: z.coerce.number().int().min(1).max(200).default(20),
  active: z.boolean().default(true),
});

export type GroupInput = z.input<typeof groupInputSchema>;
