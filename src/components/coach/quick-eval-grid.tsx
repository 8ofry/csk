"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertQuickEvalAction } from "@/app/actions/sessions";

// Body part data lives in a shared pure lib so server components can also import it.
import {
  type BodyPartKey,
  getBodyPartLabel as _getBodyPartLabel,
} from "@/lib/body-parts";
export type { BodyPartKey };
// Re-export for backward compat (server pages that imported this before the split)
export { _getBodyPartLabel as getBodyPartLabel };

function getPartKey(relativeX: number, relativeY: number): BodyPartKey | null {
  if (relativeX < 203.5) {
    // Front view: Viewer's Left (< 100) is Trainee's Right (_r), Viewer's Right (>= 100) is Trainee's Left (_l)
    if (relativeY < 50) return "head_neck";
    if (relativeY >= 50 && relativeY < 95 && (relativeX < 75 || relativeX > 130)) {
      return relativeX < 100 ? "shoulders_r" : "shoulders_l";
    }
    if (relativeY >= 75 && relativeY < 140 && (relativeX < 65 || relativeX > 140)) {
      return relativeX < 100 ? "upper_arms_r" : "upper_arms_l";
    }
    if (relativeY >= 140 && relativeY < 200 && (relativeX < 60 || relativeX > 145)) {
      return relativeX < 100 ? "forearms_r" : "forearms_l";
    }
    if (relativeY >= 50 && relativeY < 110 && relativeX >= 65 && relativeX <= 140) return "chest";
    if (relativeY >= 110 && relativeY < 170 && relativeX >= 65 && relativeX <= 140) return "core_abs";
    if (relativeY >= 170 && relativeY < 200 && relativeX >= 65 && relativeX <= 140) return "hips";
    if (relativeY >= 200 && relativeY < 270) {
      return relativeX < 100 ? "thighs_r" : "thighs_l";
    }
    if (relativeY >= 270 && relativeY < 295) {
      return relativeX < 100 ? "knees_r" : "knees_l";
    }
    if (relativeY >= 295 && relativeY < 340) {
      return relativeX < 100 ? "shins_r" : "shins_l";
    }
    if (relativeY >= 340) {
      return relativeX < 100 ? "feet_r" : "feet_l";
    }
  } else {
    // Back view: Viewer's Left (< 305) is Trainee's Left (_l), Viewer's Right (>= 305) is Trainee's Right (_r)
    if (relativeY < 50) return "head_neck";
    if (relativeY >= 50 && relativeY < 95 && (relativeX < 280 || relativeX > 335)) {
      return relativeX < 305 ? "shoulders_l" : "shoulders_r";
    }
    if (relativeY >= 75 && relativeY < 140 && (relativeX < 270 || relativeX > 345)) {
      return relativeX < 305 ? "upper_arms_l" : "upper_arms_r";
    }
    if (relativeY >= 140 && relativeY < 200 && (relativeX < 265 || relativeX > 350)) {
      return relativeX < 305 ? "forearms_l" : "forearms_r";
    }
    if (relativeY >= 50 && relativeY < 110 && relativeX >= 270 && relativeX <= 345) return "upper_back";
    if (relativeY >= 110 && relativeY < 170 && relativeX >= 270 && relativeX <= 345) return "lower_back";
    if (relativeY >= 170 && relativeY < 200 && relativeX >= 270 && relativeX <= 345) return "hips";
    if (relativeY >= 200 && relativeY < 270) {
      return relativeX < 305 ? "thighs_l" : "thighs_r";
    }
    if (relativeY >= 270 && relativeY < 295) {
      return relativeX < 305 ? "knees_l" : "knees_r";
    }
    if (relativeY >= 295 && relativeY < 340) {
      return relativeX < 305 ? "shins_l" : "shins_r";
    }
    if (relativeY >= 340) {
      return relativeX < 305 ? "feet_l" : "feet_r";
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
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4, 5].map((star) => {
        if (star === 0) return null;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className="p-0 focus:outline-none focus:scale-110 transition shrink-0"
          >
            <svg
              className={`h-4 w-4 transition-all ${
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

function CompactStarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="p-0 focus:outline-none focus:scale-110 transition shrink-0"
        >
          <svg
            className={`h-3 w-3 transition-all ${
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
      ))}
    </div>
  );
}

interface TechEvalRow {
  id: string;
  action: string;
  score: number;
  comment: string;
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
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  // Parse structured JSON notes if exists
  let initialGeneralScore = 0;
  let initialGeneralComment = "";
  let initialTechActions: TechEvalRow[] = [];

  if (row.current?.notes) {
    try {
      const data = JSON.parse(row.current.notes);
      initialGeneralScore = data.generalScore ?? 0;
      initialGeneralComment = data.generalComment ?? "";
      
      if (Array.isArray(data.technicalActions)) {
        initialTechActions = data.technicalActions.map((ta: { id?: string; action?: string; score?: number; comment?: string }, idx: number) => ({
          id: ta.id || `init-${idx}`,
          action: ta.action ?? "",
          score: ta.score ?? 0,
          comment: ta.comment ?? "",
        }));
      } else if (data.technicalAction) {
        initialTechActions = [
          {
            id: "init-0",
            action: data.technicalAction,
            score: data.technicalScore ?? 0,
            comment: data.technicalComment ?? "",
          },
        ];
      }
    } catch {
      // Fallback if notes is plain text
      initialGeneralComment = row.current.notes;
    }
  }

  const [flaggedPart, setFlaggedPart] = useState<BodyPartKey | null>(
    row.current?.flaggedBodyPart as BodyPartKey | null
  );

  // Star rating states
  const [generalScore, setGeneralScore] = useState(initialGeneralScore);
  const [generalComment, setGeneralComment] = useState(initialGeneralComment);
  const [techActions, setTechActions] = useState<TechEvalRow[]>(initialTechActions);

  // Inline SVG Ref and useEffect hook
  const inlineSvgRef = useRef<HTMLDivElement>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!svgContent || !inlineSvgRef.current) return;

    const svgElement = inlineSvgRef.current.querySelector("svg");
    if (!svgElement) return;

    // Force SVG to fill container width; height is controlled by the CSS container.
    // We only set attributes here — size constraints live on the CSS wrapper div.
    svgElement.setAttribute("width", "100%");
    svgElement.removeAttribute("height"); // let aspect ratio flow from viewBox
    svgElement.style.display = "block";
    svgElement.style.cursor = "pointer";

    const svgRect = svgElement.getBoundingClientRect();
    if (svgRect.width === 0) {
      const timer = setTimeout(() => setRetryTrigger((p) => p + 1), 100);
      return () => clearTimeout(timer);
    }

    // Single SVG-level click handler — use mouse coordinates to find body part.
    const handleSvgClick = (e: MouseEvent) => {
      const freshRect = svgElement.getBoundingClientRect();
      const relX = ((e.clientX - freshRect.left) / freshRect.width) * 407;
      const relY = ((e.clientY - freshRect.top) / freshRect.height) * 354.4;
      const key = getPartKey(relX, relY);
      if (key) handleBodyPartChange(key);
    };
    svgElement.addEventListener("click", handleSvgClick);

    // Build key map for visible leaf elements
    const leafElements = inlineSvgRef.current.querySelectorAll<SVGGraphicsElement>(
      "svg > g path, svg > g use"
    );
    const pathKeysMap = new Map<SVGGraphicsElement, BodyPartKey>();
    leafElements.forEach((el) => {
      try {
        const elRect = el.getBoundingClientRect();
        if (elRect.width === 0 && elRect.height === 0) return;
        const cx = ((elRect.left + elRect.width / 2 - svgRect.left) / svgRect.width) * 407;
        const cy = ((elRect.top + elRect.height / 2 - svgRect.top) / svgRect.height) * 354.4;
        const key = getPartKey(cx, cy);
        if (key) pathKeysMap.set(el, key);
      } catch { /* skip */ }
    });

    // Use individual style properties so we NEVER wipe the original SVG fill/stroke styles.
    // Setting a property to "" removes our override and restores the original value.
    const applyHighlight = (el: SVGGraphicsElement, active: boolean) => {
      if (active) {
        el.style.fill = "#ef4444";
        el.style.fillOpacity = "0.6";
        el.style.stroke = "#dc2626";
        el.style.strokeWidth = "2";
        el.style.transition = "all 0.2s";
      } else {
        el.style.fill = "";
        el.style.fillOpacity = "";
        el.style.stroke = "";
        el.style.strokeWidth = "";
        el.style.transition = "";
      }
    };

    pathKeysMap.forEach((key, el) => {
      applyHighlight(el, !!(flaggedPart && flaggedPart === key));
    });

    return () => {
      svgElement.removeEventListener("click", handleSvgClick);
      // Reset only our highlight properties — preserves original SVG inline styles
      pathKeysMap.forEach((_, el) => applyHighlight(el, false));
    };
  }, [svgContent, retryTrigger, flaggedPart]);

  // Trigger evaluation reset when selecting a new body part to auto-load related options
  const handleBodyPartChange = (part: BodyPartKey | null) => {
    setFlaggedPart(part);
    setTechActions([]);
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

  const addTechActionRow = () => {
    setTechActions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        action: "",
        score: 0,
        comment: "",
      },
    ]);
  };

  const updateTechActionRow = <K extends keyof TechEvalRow>(id: string, field: K, value: TechEvalRow[K]) => {
    setTechActions((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeTechActionRow = (id: string) => {
    setTechActions((prev) => prev.filter((row) => row.id !== id));
  };

  // Form submission: serialize notes to JSON string
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // If a body part is flagged, we package the evaluations as JSON
    if (flaggedPart) {
      const payload = {
        generalScore,
        generalComment,
        technicalActions: techActions.map((ta) => ({
          action: ta.action,
          score: ta.score,
          comment: ta.comment,
        })),
      };
      fd.set("notes", JSON.stringify(payload));
    } else {
      // Otherwise, save general comment as simple text
      fd.set("notes", generalComment);
    }

    // Store comma-separated flagged skills
    const flaggedSkillValue = techActions.map((ta) => ta.action).filter(Boolean).join(", ");
    fd.set("flaggedSkill", flaggedSkillValue);

    startTransition(async () => {
      setError(null);
      const result = await upsertQuickEvalAction(sessionId, fd);
      if (result.error) setError(result.error);
      else {
        setSavedAt(new Date());
        // Auto-dismiss the confirmation after 4 seconds
        setTimeout(() => setSavedAt(null), 4000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="traineeId" value={row.traineeId} />
      <input type="hidden" name="flaggedBodyPart" value={flaggedPart ?? ""} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Effort & Inline Body Part Selection */}
        <div className="space-y-5">
          {/* Effort Score Slider/Radio */}
          <div className="bg-muted/10 p-3 rounded-lg border">
            <label className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wide">
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

          {/* Inline SVG Map Selector */}
          {svgContent && (
            <div className="border rounded-xl p-3 bg-muted/10 shadow-inner flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {locale === "ar" ? "تحديد العضو المصاب أو المتعب من الرسم:" : "Flag Trainee Muscle / Body Part:"}
                </span>
                {flaggedPart ? (
                  <Badge variant="destructive" className="flex items-center gap-1.5 text-[10px] font-bold py-0.5 px-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                    {_getBodyPartLabel(flaggedPart, locale)}
                    <button
                      type="button"
                      onClick={() => handleBodyPartChange(null)}
                      className="ml-1 text-white hover:text-red-200 transition font-bold"
                    >
                      ✕
                    </button>
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {locale === "ar" ? "اضغط على عضو لتحديده" : "Click to select a part"}
                  </span>
                )}
              </div>
              {/* Fixed-height container — SVG can never escape this box */}
              <div className="w-full h-[220px] overflow-hidden flex items-center justify-center">
                <div
                  ref={inlineSvgRef}
                  className="w-full max-w-[280px] h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Evaluation Form */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0">
          
          {/* General muscle power evaluation */}
          <div className="bg-muted/10 p-3 rounded-lg border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center justify-between mb-2">
              <span>{locale === "ar" ? "تقييم قوة العضلة والحالة البدنية" : "General Muscle Power & Condition"}</span>
              {flaggedPart && <span className="text-red-500 font-bold text-[10px]">● {_getBodyPartLabel(flaggedPart, locale)}</span>}
            </h4>

            {/* Comment LEFT (flex-1), Stars RIGHT (shrink-0) — consistent with technical action rows */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Textarea
                  name="notes-placeholder"
                  rows={2}
                  className="min-h-[48px] resize-none text-xs w-full"
                  placeholder={
                    flaggedPart
                      ? (locale === "ar" ? "اكتب ملاحظات بدنية عن العضو المحدد..." : "Observations about this muscle power...")
                      : t("notesPlaceholder")
                  }
                  value={generalComment}
                  onChange={(e) => setGeneralComment(e.target.value)}
                />
              </div>
              {flaggedPart && (
                <div className="shrink-0 flex flex-col items-center gap-0.5">
                  <StarRating value={generalScore} onChange={setGeneralScore} />
                  <span className="text-[9px] text-muted-foreground">{generalScore}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Related technical actions (Multiple, dynamically added) */}
          {flaggedPart && (
            <div className="space-y-3 border-t pt-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {locale === "ar" ? "المهارات الفنية والتقييمات" : "Technical Actions & Execution"}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTechActionRow}
                  className="h-7 text-[10px] border-csk-gold/40 text-csk-gold hover:bg-csk-gold/10 font-bold px-2 py-0"
                >
                  {locale === "ar" ? "+ إضافة حركة فنية" : "+ Add Technical Action"}
                </Button>
              </div>

              {techActions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-muted/5 p-3 rounded-md text-center border border-dashed">
                  {locale === "ar" ? "لا توجد حركات مضافة بعد. اضغط على الزر بالأعلى لإضافة حركة فنية." : "No technical actions added yet. Click the button above to add one."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {techActions.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-1.5 bg-muted/20 px-2 py-1.5 rounded-md border border-dashed text-xs shadow-sm"
                    >
                      {/* Left: Dropdown (fixed width) */}
                      <select
                        value={row.action}
                        onChange={(e) => updateTechActionRow(row.id, "action", e.target.value)}
                        required
                        className="h-7 w-[110px] rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-csk-gold shrink-0 font-medium"
                      >
                        <option value="">
                          {locale === "ar" ? "— الحركة —" : "— Action —"}
                        </option>
                        {techOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Middle: Comment (flex-1, takes all remaining space) */}
                      <Input
                        type="text"
                        placeholder={locale === "ar" ? "ملاحظات فنية..." : "Technical comments..."}
                        value={row.comment}
                        onChange={(e) => updateTechActionRow(row.id, "comment", e.target.value)}
                        className="flex-1 h-7 text-xs px-2 min-w-0"
                      />

                      {/* Right: Stars + Remove (compact, shrink-0) */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <CompactStarRating
                          value={row.score}
                          onChange={(val) => updateTechActionRow(row.id, "score", val)}
                        />
                        <button
                          type="button"
                          onClick={() => removeTechActionRow(row.id)}
                          className="h-6 w-6 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive flex items-center justify-center transition text-xs"
                          title={locale === "ar" ? "إزالة" : "Remove"}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Controls */}
      <div className="flex items-center justify-between border-t pt-3 mt-4">
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-600 animate-in fade-in duration-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {locale === "ar" ? "تم الحفظ ✓" : `Saved ✓`}
            </span>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" size="sm" disabled={pending} className="px-6">
          {pending ? "…" : t("saveBtn")}
        </Button>
      </div>
    </form>
  );
}
