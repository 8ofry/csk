import { z } from "zod";

// Body parts the coach can target (FR-EVAL-03 + FR-UNIT-02)
export const TARGET_BODY_PARTS = [
  "head_neck",
  "shoulders_l",
  "shoulders_r",
  "upper_arms_l",
  "upper_arms_r",
  "forearms_l",
  "forearms_r",
  "chest",
  "core_abs",
  "upper_back",
  "lower_back",
  "hips",
  "thighs_l",
  "thighs_r",
  "knees_l",
  "knees_r",
  "shins_l",
  "shins_r",
  "feet_l",
  "feet_r",
] as const;

export const TRAINING_UNIT_CATEGORIES = [
  "warm-up",
  "technique",
  "sparring",
  "strength",
  "conditioning",
  "cool-down",
] as const;

export const trainingUnitInputSchema = z
  .object({
    nameAr: z.string().min(2),
    nameEn: z.string().min(2),
    descriptionAr: z.string().optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    category: z.enum(TRAINING_UNIT_CATEGORIES),
    disciplineIds: z.array(z.string().min(1)).min(1, "Pick at least one discipline"),
    targetBodyParts: z.array(z.enum(TARGET_BODY_PARTS)).default([]),
    // Free-form skills referencing the discipline's skills taxonomy
    targetSkills: z.array(z.string().min(1)).default([]),
    difficulty: z.coerce.number().int().min(1).max(5),
    recommendedDurationSeconds: z.coerce.number().int().min(0).nullable().optional(),
    recommendedRounds: z.coerce.number().int().min(0).nullable().optional(),
    recommendedRoundDurationSec: z.coerce.number().int().min(0).nullable().optional(),
    equipmentRequired: z.array(z.string().min(1)).default([]),
    demoMediaUrl: z.string().url().nullable().optional(),
    demoMediaType: z.enum(["gif", "mp4"]).nullable().optional(),
    published: z.boolean().default(false),
  })
  .refine(
    (d) =>
      // FR-UNIT-03: media required to publish
      !d.published || (d.demoMediaUrl && d.demoMediaType),
    { message: "Demo GIF/MP4 is required to publish a unit", path: ["demoMediaUrl"] },
  );

export type TrainingUnitInput = z.infer<typeof trainingUnitInputSchema>;

export const trainingUnitFiltersSchema = z.object({
  disciplineId: z.string().optional(),
  category: z.enum(TRAINING_UNIT_CATEGORIES).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  targetSkill: z.string().optional(),
  equipment: z.string().optional(),
  publishedOnly: z.boolean().optional(),
});

export type TrainingUnitFilters = z.infer<typeof trainingUnitFiltersSchema>;
