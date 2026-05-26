"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertQuickEvalAction } from "@/app/actions/sessions";

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

const BODY_PART_LABELS: Record<BodyPartKey, { en: string; ar: string }> = {
  head_neck: { en: "Head / Neck", ar: "الرأس / الرقبة" },
  shoulders_l: { en: "Left Shoulder", ar: "الكتف الأيسر" },
  shoulders_r: { en: "Right Shoulder", ar: "الكتف الأيمن" },
  upper_arms_l: { en: "Left Upper Arm", ar: "العضد الأيسر" },
  upper_arms_r: { en: "Right Upper Arm", ar: "العضد الأيمن" },
  forearms_l: { en: "Left Forearm", ar: "الساعد الأيسر" },
  forearms_r: { en: "Right Forearm", ar: "الساعد الأيمن" },
  chest: { en: "Chest", ar: "الصدر" },
  core_abs: { en: "Core / Abs", ar: "البطن / الجذع" },
  upper_back: { en: "Upper Back", ar: "أعلى الظهر" },
  lower_back: { en: "Lower Back", ar: "أسفل الظهر" },
  hips: { en: "Hips", ar: "الحوض" },
  thighs_l: { en: "Left Thigh", ar: "الفخذ الأيسر" },
  thighs_r: { en: "Right Thigh", ar: "الفخذ الأيمن" },
  knees_l: { en: "Left Knee", ar: "الركبة اليسرى" },
  knees_r: { en: "Right Knee", ar: "الركبة اليمنى" },
  shins_l: { en: "Left Shin", ar: "الساق اليسرى" },
  shins_r: { en: "Right Shin", ar: "الساق اليمنى" },
  feet_l: { en: "Left Foot", ar: "القدم اليسرى" },
  feet_r: { en: "Right Foot", ar: "القدم اليمنى" },
};

// General body parts list for simple selector
const GENERAL_BODY_PARTS: { key: BodyPartKey; label: { en: string; ar: string } }[] = [
  { key: "head_neck", label: { en: "Head / Neck", ar: "الرأس / الرقبة" } },
  { key: "chest", label: { en: "Chest", ar: "الصدر" } },
  { key: "core_abs", label: { en: "Core / Abs", ar: "البطن / الجذع" } },
  { key: "upper_back", label: { en: "Upper Back", ar: "أعلى الظهر" } },
  { key: "lower_back", label: { en: "Lower Back", ar: "أسفل الظهر" } },
  { key: "hips", label: { en: "Hips", ar: "الحوض" } },
  { key: "upper_arms_l", label: { en: "Left Arm / Hand", ar: "الذراع الأيسر / اليد" } },
  { key: "upper_arms_r", label: { en: "Right Arm / Hand", ar: "الذراع الأيمن / اليد" } },
  { key: "thighs_l", label: { en: "Left Leg / Foot", ar: "الرجل اليسرى / القدم" } },
  { key: "thighs_r", label: { en: "Right Leg / Foot", ar: "الرجل اليمنى / القدم" } },
];

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

function getPartKey(relativeX: number, relativeY: number): BodyPartKey | null {
  if (relativeX < 203.5) {
    // Front view
    if (relativeY < 50) return "head_neck";
    if (relativeY >= 50 && relativeY < 95 && (relativeX < 75 || relativeX > 130)) {
      return relativeX < 100 ? "shoulders_l" : "shoulders_r";
    }
    if (relativeY >= 75 && relativeY < 140 && (relativeX < 65 || relativeX > 140)) {
      return relativeX < 100 ? "upper_arms_l" : "upper_arms_r";
    }
    if (relativeY >= 140 && relativeY < 200 && (relativeX < 60 || relativeX > 145)) {
      return relativeX < 100 ? "forearms_l" : "forearms_r";
    }
    if (relativeY >= 50 && relativeY < 110 && relativeX >= 65 && relativeX <= 140) return "chest";
    if (relativeY >= 110 && relativeY < 170 && relativeX >= 65 && relativeX <= 140) return "core_abs";
    if (relativeY >= 170 && relativeY < 200 && relativeX >= 65 && relativeX <= 140) return "hips";
    if (relativeY >= 200 && relativeY < 270) {
      return relativeX < 100 ? "thighs_l" : "thighs_r";
    }
    if (relativeY >= 270 && relativeY < 295) {
      return relativeX < 100 ? "knees_l" : "knees_r";
    }
    if (relativeY >= 295 && relativeY < 340) {
      return relativeX < 100 ? "shins_l" : "shins_r";
    }
    if (relativeY >= 340) {
      return relativeX < 100 ? "feet_l" : "feet_r";
    }
  } else {
    // Back view
    if (relativeY < 50) return "head_neck";
    if (relativeY >= 50 && relativeY < 95 && (relativeX < 280 || relativeX > 335)) {
      return relativeX < 305 ? "shoulders_r" : "shoulders_l";
    }
    if (relativeY >= 75 && relativeY < 140 && (relativeX < 270 || relativeX > 345)) {
      return relativeX < 305 ? "upper_arms_r" : "upper_arms_l";
    }
    if (relativeY >= 140 && relativeY < 200 && (relativeX < 265 || relativeX > 350)) {
      return relativeX < 305 ? "forearms_r" : "forearms_l";
    }
    if (relativeY >= 50 && relativeY < 110 && relativeX >= 270 && relativeX <= 345) return "upper_back";
    if (relativeY >= 110 && relativeY < 170 && relativeX >= 270 && relativeX <= 345) return "lower_back";
    if (relativeY >= 170 && relativeY < 200 && relativeX >= 270 && relativeX <= 345) return "hips";
    if (relativeY >= 200 && relativeY < 270) {
      return relativeX < 305 ? "thighs_r" : "thighs_l";
    }
    if (relativeY >= 270 && relativeY < 295) {
      return relativeX < 305 ? "knees_r" : "knees_l";
    }
    if (relativeY >= 295 && relativeY < 340) {
      return relativeX < 305 ? "shins_r" : "shins_l";
    }
    if (relativeY >= 340) {
      return relativeX < 305 ? "feet_r" : "feet_l";
    }
  }
  return null;
}

interface EvalRow {
  traineeId: string;
  fullNameEn: string;
  fullNameAr: string;
  current?: {
    effortScore: number;
    notes: string | null;
    flaggedBodyPart: string | null;
    flaggedSkill: string | null;
  };
}

// 0-5 Star Rating Component
function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4, 5].map((star) => {
        if (star === 0) return null; // 0 starts as default unselected
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none focus:scale-110 transition shrink-0"
          >
            <svg
              className={`h-7 w-7 transition-all ${
                star <= value
                  ? "text-amber-500 fill-amber-500 drop-shadow-sm scale-105"
                  : "text-muted-foreground/30 hover:text-amber-500/40"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-sm font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
        {value}/5
      </span>
    </div>
  );
}

export function QuickEvalGrid({
  sessionId,
  trainees,
  svgContent,
}: {
  sessionId: string;
  trainees: EvalRow[];
  svgContent?: string;
}) {
  const locale = useLocale();
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>("");

  // Update selected trainee when roster changes
  useEffect(() => {
    if (trainees.length > 0 && !trainees.some((t) => t.traineeId === selectedTraineeId)) {
      setSelectedTraineeId(trainees[0]?.traineeId ?? "");
    }
  }, [trainees, selectedTraineeId]);

  const activeTrainee = trainees.find((t) => t.traineeId === selectedTraineeId);

  if (trainees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/5">
        {locale === "ar"
          ? "لم يحضر أي متدربين بعد للتقييم. يرجى تحضيرهم في كشف الحضور أولاً."
          : "No attended trainees available to evaluate. Please check them in first."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trainee Selector Search/Combobox */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-lg border">
        <label className="text-sm font-bold text-foreground">
          {locale === "ar" ? "اختر المتدرب للتقييم:" : "Select Trainee to Evaluate:"}
        </label>
        <select
          value={selectedTraineeId}
          onChange={(e) => setSelectedTraineeId(e.target.value)}
          className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          {trainees.map((t) => (
            <option key={t.traineeId} value={t.traineeId}>
              {locale === "ar" ? t.fullNameAr : t.fullNameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Render the evaluation form of the selected trainee */}
      {activeTrainee && (
        <div className="rounded-lg border bg-background p-4 shadow-sm animate-in fade-in duration-200">
          <div className="border-b pb-2 mb-4">
            <h3 className="text-base font-bold text-foreground">{activeTrainee.fullNameEn}</h3>
            <p className="text-xs text-muted-foreground">{activeTrainee.fullNameAr}</p>
          </div>
          <QuickEvalForm
            key={activeTrainee.traineeId}
            sessionId={sessionId}
            row={activeTrainee}
            svgContent={svgContent}
          />
        </div>
      )}
    </div>
  );
}

function QuickEvalForm({
  sessionId,
  row,
  svgContent,
}: {
  sessionId: string;
  row: EvalRow;
  svgContent?: string;
}) {
  const t = useTranslations("coachQuickEval");
  const tBadges = useTranslations("badges");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  // Parse structured JSON notes if exists
  let initialGeneralScore = 0;
  let initialGeneralComment = "";
  let initialTechnicalAction = "";
  let initialTechnicalScore = 0;
  let initialTechnicalComment = "";

  if (row.current?.notes) {
    try {
      const data = JSON.parse(row.current.notes);
      initialGeneralScore = data.generalScore ?? 0;
      initialGeneralComment = data.generalComment ?? "";
      initialTechnicalAction = data.technicalAction ?? "";
      initialTechnicalScore = data.technicalScore ?? 0;
      initialTechnicalComment = data.technicalComment ?? "";
    } catch {
      // Fallback if notes is plain text
      initialGeneralComment = row.current.notes;
    }
  }

  const [flaggedPart, setFlaggedPart] = useState<BodyPartKey | null>(
    row.current?.flaggedBodyPart as BodyPartKey | null
  );
  const [showModal, setShowModal] = useState(false);

  // Star rating states
  const [generalScore, setGeneralScore] = useState(initialGeneralScore);
  const [generalComment, setGeneralComment] = useState(initialGeneralComment);

  const [technicalAction, setTechnicalAction] = useState(initialTechnicalAction);
  const [technicalScore, setTechnicalScore] = useState(initialTechnicalScore);
  const [technicalComment, setTechnicalComment] = useState(initialTechnicalComment);

  // Trigger evaluation reset when selecting a new body part to auto-load related options
  const handleBodyPartChange = (part: BodyPartKey | null) => {
    setFlaggedPart(part);
    // Auto reset technical action if the body part type changes
    setTechnicalAction("");
    setTechnicalScore(0);
    setTechnicalComment("");
  };

  // Determine list of technical actions based on body parts
  const getTechnicalActions = (part: BodyPartKey | null): { value: string; label: string }[] => {
    if (!part) return [];
    
    // Arm/Hand/Shoulder
    if (
      part.includes("shoulder") ||
      part.includes("upper_arm") ||
      part.includes("forearm")
    ) {
      return [
        { value: "JAB", label: locale === "ar" ? "جاب / لكمة مستقيمة" : "Jab" },
        { value: "CROSS", label: locale === "ar" ? "كروس / لكمة مستقيمة خلفية" : "Cross" },
        { value: "HOOK", label: locale === "ar" ? "هوك / لكمة خطافية" : "Hook" },
        { value: "UPPERCUT", label: locale === "ar" ? "أبركوت / لكمة صاعدة" : "Uppercut" },
        { value: "BACK_FIST", label: locale === "ar" ? "باك فيست / لكمة خلفية" : "Back Fist" },
      ];
    }

    // Leg/Foot/Knee
    if (
      part.includes("thigh") ||
      part.includes("knee") ||
      part.includes("shin") ||
      part.includes("feet")
    ) {
      return [
        { value: "FRONT_KICK", label: locale === "ar" ? "ركلة أمامية" : "Front Kick" },
        { value: "ROUNDHOUSE_KICK", label: locale === "ar" ? "ركلة دائرية" : "Roundhouse Kick" },
        { value: "SIDE_KICK", label: locale === "ar" ? "ركلة جانبية" : "Side Kick" },
        { value: "KNEE_STRIKE", label: locale === "ar" ? "ضربة ركبة" : "Knee Strike" },
      ];
    }

    // Core/Back/Head
    return [
      { value: "DEFENSE", label: locale === "ar" ? "الدفاع" : "Defense" },
      { value: "HEAD_MOVEMENT", label: locale === "ar" ? "حركة الرأس" : "Head Movement" },
      { value: "FOOTWORK", label: locale === "ar" ? "تحركات القدمين" : "Footwork" },
    ];
  };

  const techOptions = getTechnicalActions(flaggedPart);

  // Form submission: serialize notes to JSON string
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // If a body part is flagged, we package the evaluations as JSON
    if (flaggedPart) {
      const payload = {
        generalScore,
        generalComment,
        technicalAction,
        technicalScore,
        technicalComment,
      };
      fd.set("notes", JSON.stringify(payload));
    } else {
      // Otherwise, save general comment as simple text
      fd.set("notes", generalComment);
    }

    startTransition(async () => {
      setError(null);
      const result = await upsertQuickEvalAction(sessionId, fd);
      if (result.error) setError(result.error);
      else setSavedAt(new Date());
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="traineeId" value={row.traineeId} />
      <input type="hidden" name="flaggedBodyPart" value={flaggedPart ?? ""} />
      <input type="hidden" name="flaggedSkill" value={technicalAction} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Effort & Body Part Selection */}
        <div className="space-y-4">
          {/* Effort Score Slider/Radio */}
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t("effortLabel")}
            </label>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <label
                  key={n}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/20 has-[:checked]:text-csk-gold transition"
                >
                  <input
                    type="radio"
                    name="effortScore"
                    value={n}
                    defaultChecked={row.current?.effortScore === n}
                    required
                    className="sr-only"
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>

          {/* General Body Part Selector (Dropdown) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {locale === "ar" ? "عضو الجسم (تحديد عام):" : "Body Part (General Selection):"}
            </label>
            <div className="flex gap-2">
              <select
                value={flaggedPart ?? ""}
                onChange={(e) => handleBodyPartChange((e.target.value as BodyPartKey) || null)}
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
              >
                <option value="">
                  {locale === "ar" ? "— اختر عضو الجسم (اختياري) —" : "— Select Body Part (Optional) —"}
                </option>
                {GENERAL_BODY_PARTS.map((gbp) => (
                  <option key={gbp.key} value={gbp.key}>
                    {locale === "ar" ? gbp.label.ar : gbp.label.en}
                  </option>
                ))}
              </select>

              {/* Anatomical Selector Button */}
              {svgContent && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-md border border-input bg-muted/40 hover:bg-muted text-foreground transition text-sm shrink-0"
                  title={locale === "ar" ? "الخريطة التشريحية" : "Anatomical Map"}
                >
                  <span>🩻</span>
                  <span className="hidden sm:inline">
                    {locale === "ar" ? "تشريح تفصيلي" : "Anatomical Map"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Evaluation Form */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l pl-0 md:pl-4 pt-4 md:pt-0">
          
          {/* General muscle power evaluation (Visible always, acts as simple notes if no part) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span>{locale === "ar" ? "تقييم قوة العضلة والحالة البدنية" : "General Muscle Power & Condition"}</span>
              {flaggedPart && <span className="text-red-500 font-bold">● {getBodyPartLabel(flaggedPart, locale)}</span>}
            </h4>

            {flaggedPart && (
              <div className="py-1">
                <StarRating value={generalScore} onChange={setGeneralScore} />
              </div>
            )}

            <Textarea
              name="notes-placeholder"
              rows={2}
              placeholder={
                flaggedPart
                  ? (locale === "ar" ? "اكتب ملاحظات بدنية عن العضو المحدد..." : "Observations about this muscle power...")
                  : t("notesPlaceholder")
              }
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          {/* Related technical action evaluation (Only visible if body part is flagged) */}
          {flaggedPart && (
            <div className="space-y-2 border-t pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {locale === "ar" ? "الحركة الفنية الفنية المرتبطة" : "Related Technical Action"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Technical Action Dropdown */}
                <select
                  value={technicalAction}
                  onChange={(e) => setTechnicalAction(e.target.value)}
                  required={!!flaggedPart}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
                >
                  <option value="">
                    {locale === "ar" ? "— الحركة الفنية —" : "— Technical Action —"}
                  </option>
                  {techOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Technical Score Stars */}
                <div className="flex items-center justify-center sm:justify-start">
                  <StarRating value={technicalScore} onChange={setTechnicalScore} />
                </div>
              </div>

              {/* Technical comments */}
              {technicalAction && (
                <Textarea
                  rows={2}
                  placeholder={
                    locale === "ar"
                      ? "اكتب ملاحظات عن الأداء الفني لهذه الحركة..."
                      : "Observations about technical execution (e.g. speed, snap)..."
                  }
                  value={technicalComment}
                  onChange={(e) => setTechnicalComment(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Controls */}
      <div className="flex items-center justify-between border-t pt-3 mt-4">
        <div className="flex items-center gap-2">
          {savedAt && (
            <Badge variant="success">{tBadges("saved")}</Badge>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" size="sm" disabled={pending} className="px-6">
          {pending ? "..." : t("saveBtn")}
        </Button>
      </div>

      {/* SVG Anatomical Map Selector Modal */}
      {showModal && svgContent && (
        <AnatomicalSelectorModal
          svgContent={svgContent}
          initialPart={flaggedPart}
          locale={locale}
          onSelect={(key) => {
            handleBodyPartChange(key);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </form>
  );
}

function AnatomicalSelectorModal({
  svgContent,
  initialPart,
  locale,
  onSelect,
  onClose,
}: {
  svgContent: string;
  initialPart: BodyPartKey | null;
  locale: string;
  onSelect: (key: BodyPartKey | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<BodyPartKey | null>(initialPart);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const svgElement = svgContainerRef.current.querySelector("svg");
    if (!svgElement) return;

    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "auto");
    svgElement.style.maxWidth = "100%";
    svgElement.style.maxHeight = "45vh";
    svgElement.style.height = "auto";

    const paths = svgContainerRef.current.querySelectorAll("path");
    const svgRect = svgElement.getBoundingClientRect();

    if (svgRect.width === 0) {
      const timer = setTimeout(() => {
        setRetryTrigger((p) => p + 1);
      }, 100);
      return () => clearTimeout(timer);
    }

    const pathKeysMap = new Map<SVGPathElement, BodyPartKey>();

    paths.forEach((path) => {
      const rect = path.getBoundingClientRect();
      const relativeX = ((rect.left + rect.width / 2 - svgRect.left) / svgRect.width) * 407;
      const relativeY = ((rect.top + rect.height / 2 - svgRect.top) / svgRect.height) * 354.4;

      const key = getPartKey(relativeX, relativeY);
      if (key) {
        pathKeysMap.set(path, key);
        path.style.cursor = "pointer";

        const clickHandler = (e: Event) => {
          e.preventDefault();
          setSelected(key);
        };
        path.addEventListener("click", clickHandler);

        const enterHandler = () => {
          if (selected !== key) {
            path.setAttribute(
              "style",
              "fill: #c5a880; fill-opacity: 0.45; stroke: #c5a880; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transition: all 0.2s;"
            );
          }
        };

        const leaveHandler = () => {
          updatePathStyles();
        };

        path.addEventListener("mouseenter", enterHandler);
        path.addEventListener("mouseleave", leaveHandler);
      }
    });

    const updatePathStyles = () => {
      paths.forEach((path) => {
        const key = pathKeysMap.get(path);
        if (!key) return;

        const isSelected = selected === key;

        let fill = "transparent";
        let fillOpacity = "0.2";
        let stroke = "transparent";
        let strokeWidth = "0";

        if (isSelected) {
          fill = "#ef4444";
          fillOpacity = "0.55";
          stroke = "#dc2626";
          strokeWidth = "2.5";
        } else {
          path.removeAttribute("style");
          path.style.cursor = "pointer";
          return;
        }

        path.setAttribute(
          "style",
          `fill: ${fill}; fill-opacity: ${fillOpacity}; stroke: ${stroke}; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; transition: all 0.2s; cursor: pointer;`
        );
      });
    };

    updatePathStyles();

    return () => {
      paths.forEach((path) => {
        path.removeAttribute("style");
      });
    };
  }, [svgContent, retryTrigger, selected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {locale === "ar" ? "تحديد العضو المصاب أو المتعب" : "Flag Trainee Muscle / Body Part"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "ar"
                ? "اضغط على أي جزء في الجسم لتحديده كعضو متأثر بالتدريب."
                : "Select a muscle region on the anatomical map to flag it."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-col items-center justify-center p-4 overflow-y-auto grow">
          <div
            ref={svgContainerRef}
            className="w-full max-w-[340px] bg-muted/5 border border-muted-foreground/10 rounded-xl p-3 shadow-inner"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>

        {/* Modal Footer */}
        <div className="border-t bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {locale === "ar" ? "العضو المحدد:" : "Selected:"}
            </span>
            {selected ? (
              <Badge variant="destructive" className="flex items-center gap-1.5 text-xs font-semibold animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                {getBodyPartLabel(selected, locale)}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {locale === "ar" ? "لم يتم تحديد أي عضو" : "None selected"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onSelect(selected)}
              className="flex-1"
              variant="default"
            >
              {locale === "ar" ? "تأكيد الاختيار" : "Confirm Selection"}
            </Button>
            {selected && (
              <Button
                type="button"
                onClick={() => setSelected(null)}
                variant="outline"
                className="text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                {locale === "ar" ? "إزالة" : "Clear"}
              </Button>
            )}
            <Button type="button" onClick={onClose} variant="outline">
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
