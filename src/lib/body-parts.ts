/**
 * Body part keys, labels, and helper — shared between server and client code.
 * No React hooks or client-only APIs — safe to import from server components.
 */

export type BodyPartKey =
  | "head_neck"
  | "shoulders_l"
  | "shoulders_r"
  | "upper_arms_l"
  | "upper_arms_r"
  | "forearms_l"
  | "forearms_r"
  | "chest"
  | "core_abs"
  | "upper_back"
  | "lower_back"
  | "hips"
  | "thighs_l"
  | "thighs_r"
  | "knees_l"
  | "knees_r"
  | "shins_l"
  | "shins_r"
  | "feet_l"
  | "feet_r";

export const BODY_PART_LABELS: Record<BodyPartKey, { en: string; ar: string }> = {
  head_neck:    { en: "Head / Neck",      ar: "الرأس / الرقبة" },
  shoulders_l:  { en: "Left Shoulder",    ar: "الكتف الأيسر" },
  shoulders_r:  { en: "Right Shoulder",   ar: "الكتف الأيمن" },
  upper_arms_l: { en: "Left Upper Arm",   ar: "العضد الأيسر" },
  upper_arms_r: { en: "Right Upper Arm",  ar: "العضد الأيمن" },
  forearms_l:   { en: "Left Forearm",     ar: "الساعد الأيسر" },
  forearms_r:   { en: "Right Forearm",    ar: "الساعد الأيمن" },
  chest:        { en: "Chest",            ar: "الصدر" },
  core_abs:     { en: "Core / Abs",       ar: "البطن / الجذع" },
  upper_back:   { en: "Upper Back",       ar: "أعلى الظهر" },
  lower_back:   { en: "Lower Back",       ar: "أسفل الظهر" },
  hips:         { en: "Hips",             ar: "الحوض" },
  thighs_l:     { en: "Left Thigh",       ar: "الفخذ الأيسر" },
  thighs_r:     { en: "Right Thigh",      ar: "الفخذ الأيمن" },
  knees_l:      { en: "Left Knee",        ar: "الركبة اليسرى" },
  knees_r:      { en: "Right Knee",       ar: "الركبة اليمنى" },
  shins_l:      { en: "Left Shin",        ar: "الساق اليسرى" },
  shins_r:      { en: "Right Shin",       ar: "الساق اليمنى" },
  feet_l:       { en: "Left Foot",        ar: "القدم اليسرى" },
  feet_r:       { en: "Right Foot",       ar: "القدم اليمنى" },
};

export function getBodyPartLabel(key: string | null, locale: string): string {
  if (!key) return "";
  const label = BODY_PART_LABELS[key as BodyPartKey];
  if (!label) {
    return key
      .replace(/_/g, " ")
      .replace(/\b(\w)/g, (m) => m.toUpperCase());
  }
  return locale === "ar" ? label.ar : label.en;
}
