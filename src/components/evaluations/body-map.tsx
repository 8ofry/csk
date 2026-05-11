"use client";

// Stylized interactive body silhouette for the detailed evaluation (FR-EVAL-02).
// Front view + back view; each region opens the side panel for scoring.
// Region keys MUST match TARGET_BODY_PARTS in @/application/training-units/schemas.

import { useState } from "react";

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
  { key: "shoulders_l", label: "Shoulder (L)", side: "front", d: "M30 100 h50 v30 h-50 z" },
  { key: "shoulders_r", label: "Shoulder (R)", side: "front", d: "M120 100 h50 v30 h-50 z" },
  { key: "chest", label: "Chest", side: "front", d: "M65 110 h70 v55 h-70 z" },
  { key: "core_abs", label: "Core / Abs", side: "front", d: "M65 165 h70 v60 h-70 z" },
  { key: "upper_arms_l", label: "Upper arm (L)", side: "front", d: "M20 130 h35 v60 h-35 z" },
  { key: "upper_arms_r", label: "Upper arm (R)", side: "front", d: "M145 130 h35 v60 h-35 z" },
  { key: "forearms_l", label: "Forearm (L)", side: "front", d: "M22 195 h33 v55 h-33 z" },
  { key: "forearms_r", label: "Forearm (R)", side: "front", d: "M145 195 h33 v55 h-33 z" },
  { key: "hips", label: "Hips", side: "front", d: "M55 225 h90 v40 h-90 z" },
  { key: "thighs_l", label: "Thigh (L)", side: "front", d: "M55 270 h40 v75 h-40 z" },
  { key: "thighs_r", label: "Thigh (R)", side: "front", d: "M105 270 h40 v75 h-40 z" },
  { key: "knees_l", label: "Knee (L)", side: "front", d: "M58 350 h34 v25 h-34 z" },
  { key: "knees_r", label: "Knee (R)", side: "front", d: "M108 350 h34 v25 h-34 z" },
  { key: "shins_l", label: "Shin (L)", side: "front", d: "M58 380 h34 v60 h-34 z" },
  { key: "shins_r", label: "Shin (R)", side: "front", d: "M108 380 h34 v60 h-34 z" },
  { key: "feet_l", label: "Foot (L)", side: "front", d: "M55 445 h40 v25 h-40 z" },
  { key: "feet_r", label: "Foot (R)", side: "front", d: "M105 445 h40 v25 h-40 z" },

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
}

function scoreColor(score?: number): string {
  if (score == null) return "fill-muted/30 stroke-border";
  if (score >= 8) return "fill-emerald-500/40 stroke-emerald-600";
  if (score >= 5) return "fill-amber-500/40 stroke-amber-600";
  return "fill-red-500/40 stroke-red-600";
}

export function BodyMap({ scores = {}, comments = {}, onChange, readOnly }: BodyMapProps) {
  const [active, setActive] = useState<BodyPartKey | null>(null);
  const front = REGIONS.filter((r) => r.side === "front");
  const back = REGIONS.filter((r) => r.side === "back");

  const allKeys = REGIONS.map((r) => r.key);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
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

      <div className="space-y-3">
        <h3 className="font-semibold">{active ? prettify(active) : "Tap a body part"}</h3>
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
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground">Scored so far</h4>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {allKeys
                .filter((k) => scores[k] != null)
                .map((k) => (
                  <li key={k} className="flex justify-between rounded-md border px-2 py-1">
                    <span>{prettify(k)}</span>
                    <strong>{scores[k]}/10</strong>
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
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Score (1–10)</label>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(partKey, { score: n })}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                score === n
                  ? "border-csk-gold bg-csk-gold/20 text-csk-gold"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Comment</label>
        <textarea
          disabled={readOnly}
          value={comment ?? ""}
          onChange={(e) => onChange?.(partKey, { comment: e.target.value })}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold disabled:cursor-not-allowed disabled:opacity-50"
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
