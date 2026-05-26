"use client";

// Stylized interactive body silhouette for the detailed evaluation (FR-EVAL-02).
// Front view + back view; each region opens the side panel for scoring.
// Now supports a fully interactive raw anatomical SVG in "Muscles_front_and_back.svg".

import { useState, useEffect, useRef } from "react";

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

interface Region {
  key: BodyPartKey;
  label: string;
  side: "front" | "back";
  /** SVG path (or rect approximation) */
  d: string;
}

// Coordinate space: 200 wide × 480 tall per silhouette.
// Drawn in an inclusive, anatomically-vague way so it works for everyone.
const REGIONS: Region[] = [
  // FRONT
  { key: "head_neck", label: "Head / Neck", side: "front", d: "M75 10 h50 a25 25 0 0 1 25 25 v40 a25 25 0 0 1 -25 25 h-50 a25 25 0 0 1 -25 -25 v-40 a25 25 0 0 1 25 -25 z" },
  { key: "shoulders_r", label: "Shoulder (R)", side: "front", d: "M30 100 h50 v30 h-50 z" },
  { key: "shoulders_l", label: "Shoulder (L)", side: "front", d: "M120 100 h50 v30 h-50 z" },
  { key: "chest", label: "Chest", side: "front", d: "M65 110 h70 v55 h-70 z" },
  { key: "core_abs", label: "Core / Abs", side: "front", d: "M65 165 h70 v60 h-70 z" },
  { key: "upper_arms_r", label: "Upper arm (R)", side: "front", d: "M20 130 h35 v60 h-35 z" },
  { key: "upper_arms_l", label: "Upper arm (L)", side: "front", d: "M145 130 h35 v60 h-35 z" },
  { key: "forearms_r", label: "Forearm (R)", side: "front", d: "M22 195 h33 v55 h-33 z" },
  { key: "forearms_l", label: "Forearm (L)", side: "front", d: "M145 195 h33 v55 h-33 z" },
  { key: "hips", label: "Hips", side: "front", d: "M55 225 h90 v40 h-90 z" },
  { key: "thighs_r", label: "Thigh (R)", side: "front", d: "M55 270 h40 v75 h-40 z" },
  { key: "thighs_l", label: "Thigh (L)", side: "front", d: "M105 270 h40 v75 h-40 z" },
  { key: "knees_r", label: "Knee (R)", side: "front", d: "M58 350 h34 v25 h-34 z" },
  { key: "knees_l", label: "Knee (L)", side: "front", d: "M108 350 h34 v25 h-34 z" },
  { key: "shins_r", label: "Shin (R)", side: "front", d: "M58 380 h34 v60 h-34 z" },
  { key: "shins_l", label: "Shin (L)", side: "front", d: "M108 380 h34 v60 h-34 z" },
  { key: "feet_r", label: "Foot (R)", side: "front", d: "M55 445 h40 v25 h-40 z" },
  { key: "feet_l", label: "Foot (L)", side: "front", d: "M105 445 h40 v25 h-40 z" },

  // BACK — only the parts that are uniquely back-side. (Limbs scored from front view to avoid duplicates.)
  { key: "upper_back", label: "Upper back", side: "back", d: "M65 110 h70 v60 h-70 z" },
  { key: "lower_back", label: "Lower back", side: "back", d: "M65 175 h70 v55 h-70 z" },
];

export interface BodyMapProps {
  /** Map of body-part key → score 1..10. */
  scores?: Partial<Record<BodyPartKey, number>>;
  /** Map of body-part key → comment. */
  comments?: Partial<Record<BodyPartKey, string>>;
  /** Called when user changes a region's score/comment. */
  onChange?: (key: BodyPartKey, patch: { score?: number; comment?: string }) => void;
  readOnly?: boolean;
  /** Raw SVG content for anatomical view */
  svgContent?: string;
}

function scoreColor(score?: number): string {
  if (score == null) return "fill-muted/30 stroke-border";
  if (score >= 8) return "fill-emerald-500/40 stroke-emerald-600";
  if (score >= 5) return "fill-amber-500/40 stroke-amber-600";
  return "fill-red-500/40 stroke-red-600";
}

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

export function BodyMap({ scores = {}, comments = {}, onChange, readOnly, svgContent }: BodyMapProps) {
  const [active, setActive] = useState<BodyPartKey | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  const front = REGIONS.filter((r) => r.side === "front");
  const back = REGIONS.filter((r) => r.side === "back");
  const allKeys = REGIONS.map((r) => r.key);

  // Dynamic SVG event wiring & styling
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const svgElement = svgContainerRef.current.querySelector("svg");
    if (!svgElement) return;

    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "auto");
    svgElement.style.maxWidth = "100%";
    svgElement.style.height = "auto";

    const svgRect = svgElement.getBoundingClientRect();
    if (svgRect.width === 0) {
      const timer = setTimeout(() => setRetryTrigger((p) => p + 1), 100);
      return () => clearTimeout(timer);
    }

    // Single SVG-level click handler using actual mouse coordinates.
    // This avoids double-fire from original <path> + mirrored <use> both having listeners.
    const handleSvgClick = (e: MouseEvent) => {
      const freshRect = svgElement.getBoundingClientRect();
      const relX = ((e.clientX - freshRect.left) / freshRect.width) * 407;
      const relY = ((e.clientY - freshRect.top) / freshRect.height) * 354.4;
      const key = getPartKey(relX, relY);
      if (key) setActive(key);
    };
    svgElement.addEventListener("click", handleSvgClick);
    svgElement.style.cursor = "pointer";

    // Build a path→key map for highlighting
    const leafElements = svgContainerRef.current.querySelectorAll<SVGGraphicsElement>(
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
      } catch {
        // skip
      }
    });

    const updatePathStyles = () => {
      pathKeysMap.forEach((key, el) => {
        const isSelected = active === key;
        const score = scores[key];

        if (score == null && !isSelected) {
          el.removeAttribute("style");
          el.style.cursor = "pointer";
          return;
        }

        let fill = "transparent";
        let fillOpacity = "0.2";
        let stroke = "transparent";
        let strokeWidth = "0";

        if (isSelected && score == null) {
          fill = "#c5a880";
          fillOpacity = "0.5";
          stroke = "#c5a880";
          strokeWidth = "2";
        } else if (score != null) {
          if (score >= 8) {
            fill = "#10b981";
            fillOpacity = isSelected ? "0.6" : "0.35";
            stroke = "#059669";
            strokeWidth = isSelected ? "2.5" : "1.2";
          } else if (score >= 5) {
            fill = "#f59e0b";
            fillOpacity = isSelected ? "0.6" : "0.35";
            stroke = "#d97706";
            strokeWidth = isSelected ? "2.5" : "1.2";
          } else {
            fill = "#ef4444";
            fillOpacity = isSelected ? "0.6" : "0.35";
            stroke = "#dc2626";
            strokeWidth = isSelected ? "2.5" : "1.2";
          }
        }

        el.setAttribute(
          "style",
          `fill: ${fill}; fill-opacity: ${fillOpacity}; stroke: ${stroke}; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; transition: all 0.2s; cursor: pointer;`
        );
      });
    };

    updatePathStyles();

    return () => {
      svgElement.removeEventListener("click", handleSvgClick);
      pathKeysMap.forEach((_, el) => el.removeAttribute("style"));
    };
  }, [svgContent, retryTrigger, active, scores]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
      {svgContent ? (
        <div className="flex flex-col items-center justify-center max-w-[550px] w-full mx-auto">
          <div className="mb-2 text-xs font-semibold text-csk-gold tracking-wide uppercase">
            Anatomical Muscle Assessment (TAP TO SCORE)
          </div>
          <div
            ref={svgContainerRef}
            className="w-full bg-muted/5 border border-muted-foreground/10 rounded-xl p-4 shadow-sm select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      ) : (
        <div className="flex justify-center gap-6">
          <Silhouette
            label="Front"
            regions={front}
            scores={scores}
            activeKey={active}
            onClick={(k) => setActive(k)}
          />
          <Silhouette
            label="Back"
            regions={back}
            scores={scores}
            activeKey={active}
            onClick={(k) => setActive(k)}
          />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
          {active ? (
            <>
              <span className="h-2 w-2 rounded-full bg-csk-gold animate-pulse" />
              {prettify(active)}
            </>
          ) : (
            "Tap a body part"
          )}
        </h3>
        {active ? (
          <RegionPanel
            partKey={active}
            score={scores[active]}
            comment={comments[active]}
            readOnly={readOnly}
            onChange={onChange}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Tap any body part on the silhouette to score and comment. Scores: 1–10.
          </p>
        )}

        {Object.keys(scores).length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Scored so far</h4>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
              {allKeys
                .filter((k) => scores[k] != null)
                .map((k) => (
                  <li key={k} className="flex justify-between items-center rounded-md border bg-muted/20 px-2.5 py-1.5 shadow-sm">
                    <span className="font-medium text-foreground">{prettify(k)}</span>
                    <strong className="text-csk-gold font-bold">{scores[k]}/10</strong>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Silhouette({
  label,
  regions,
  scores,
  activeKey,
  onClick,
}: {
  label: string;
  regions: Region[];
  scores: Partial<Record<BodyPartKey, number>>;
  activeKey: BodyPartKey | null;
  onClick: (k: BodyPartKey) => void;
}) {
  return (
    <div className="text-center">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      <svg viewBox="0 0 200 480" width={170} height={408} className="touch-manipulation">
        {regions.map((r) => (
          <path
            key={r.key}
            d={r.d}
            className={`cursor-pointer transition ${scoreColor(scores[r.key])} ${
              activeKey === r.key ? "stroke-2" : "stroke-1"
            } hover:stroke-csk-gold`}
            onClick={() => onClick(r.key)}
          >
            <title>
              {prettify(r.key)}
              {scores[r.key] != null ? ` — ${scores[r.key]}/10` : ""}
            </title>
          </path>
        ))}
      </svg>
    </div>
  );
}

function RegionPanel({
  partKey,
  score,
  comment,
  readOnly,
  onChange,
}: {
  partKey: BodyPartKey;
  score?: number;
  comment?: string;
  readOnly?: boolean;
  onChange?: (key: BodyPartKey, patch: { score?: number; comment?: string }) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-4 bg-muted/5 shadow-inner">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Score (1–10)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(partKey, { score: n })}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                score === n
                  ? "border-csk-gold bg-csk-gold/20 text-csk-gold shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Comment / Observation
        </label>
        <textarea
          disabled={readOnly}
          value={comment ?? ""}
          onChange={(e) => onChange?.(partKey, { comment: e.target.value })}
          rows={3}
          placeholder="Describe muscle response, strength, or flex issues..."
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function prettify(key: BodyPartKey): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b(\w)/g, (m) => m.toUpperCase())
    .replace(/\bL\b/, "(L)")
    .replace(/\bR\b/, "(R)");
}

export function defaultBodyPartKeys(): BodyPartKey[] {
  return REGIONS.map((r) => r.key);
}
