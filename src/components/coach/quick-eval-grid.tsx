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

export function QuickEvalGrid({
  sessionId,
  trainees,
  svgContent,
}: {
  sessionId: string;
  trainees: EvalRow[];
  svgContent?: string;
}) {
  return (
    <ul className="space-y-3">
      {trainees.map((t) => (
        <li key={t.traineeId} className="rounded-md border p-3">
          <QuickEvalForm sessionId={sessionId} row={t} svgContent={svgContent} />
        </li>
      ))}
    </ul>
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

  const [flaggedPart, setFlaggedPart] = useState<BodyPartKey | null>(
    row.current?.flaggedBodyPart as BodyPartKey | null
  );
  const [showModal, setShowModal] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await upsertQuickEvalAction(sessionId, fd);
          if (result.error) setError(result.error);
          else setSavedAt(new Date());
        });
      }}
      className="space-y-3"
    >
      <input type="hidden" name="traineeId" value={row.traineeId} />
      <input type="hidden" name="flaggedBodyPart" value={flaggedPart ?? ""} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{row.fullNameEn}</div>
          <div className="text-xs text-muted-foreground">{row.fullNameAr}</div>
        </div>
        {savedAt && <Badge variant="success">{tBadges("saved")}</Badge>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("effortLabel")}
        </label>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <label
              key={n}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/20 has-[:checked]:text-csk-gold transition-all duration-200"
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

      <Textarea
        name="notes"
        rows={2}
        placeholder={t("notesPlaceholder")}
        defaultValue={row.current?.notes ?? ""}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Flagged Body Part (Anatomical SVG Trigger) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {locale === "ar" ? "العضو المصاب/المتعب" : "Flagged Muscle/Part"}
          </label>
          {flaggedPart ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-1.5 pl-3 shadow-sm select-none">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-sm font-medium text-red-500 truncate grow">
                {getBodyPartLabel(flaggedPart, locale)}
              </span>
              <button
                type="button"
                onClick={() => setFlaggedPart(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 transition shrink-0"
                title={locale === "ar" ? "إلغاء التحديد" : "Clear selection"}
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted transition shrink-0"
                title={locale === "ar" ? "تعديل" : "Edit"}
              >
                ✏️
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <span>🩻</span>
              <span>{locale === "ar" ? "خريطة الجسم التفاعلية" : "Interactive Body Map"}</span>
            </button>
          )}
        </div>

        {/* Flagged Skill */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("skillPlaceholder")}
          </label>
          <Input
            name="flaggedSkill"
            placeholder={t("skillPlaceholder")}
            defaultValue={row.current?.flaggedSkill ?? ""}
            className="h-10"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
        {pending ? "..." : t("saveBtn")}
      </Button>

      {showModal && svgContent && (
        <AnatomicalSelectorModal
          svgContent={svgContent}
          initialPart={flaggedPart}
          locale={locale}
          onSelect={(key) => {
            setFlaggedPart(key);
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
