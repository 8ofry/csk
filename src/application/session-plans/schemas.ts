import { z } from "zod";

// FR-SES-01: ordered sequence of training units, each with overrides
export const planUnitItemSchema = z.object({
  trainingUnitId: z.string().min(1),
  durationOverrideSec: z.coerce.number().int().min(0).nullable().optional(),
  roundsOverride: z.coerce.number().int().min(0).nullable().optional(),
  notes: z.string().max(500).optional(),
});

export type PlanUnitItem = z.infer<typeof planUnitItemSchema>;

export const sessionPlanInputSchema = z.object({
  groupId: z.string().min(1),
  sessionDate: z.coerce.date(),
  units: z.array(planUnitItemSchema).min(1, "Pick at least one training unit"),
  notes: z.string().max(2000).optional(),
  isTemplate: z.boolean().default(false),
  templateName: z.string().optional(),
});

export type SessionPlanInput = z.infer<typeof sessionPlanInputSchema>;
