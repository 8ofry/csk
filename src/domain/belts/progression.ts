// Belt level progression — pure logic.
// SRS Glossary: Level (N, A, B, C). FR-BLT-04: passing exam auto-updates level.

export type LevelBand = "N" | "A" | "B" | "C";

const ORDER: LevelBand[] = ["N", "A", "B", "C"];

export class LevelProgressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LevelProgressionError";
  }
}

/** The next level above `current`. Returns null if already at the top. */
export function nextLevel(current: LevelBand | null | undefined): LevelBand | null {
  if (!current) return "A"; // newbie → A
  const idx = ORDER.indexOf(current);
  if (idx < 0) return "A";
  if (idx + 1 >= ORDER.length) return null;
  return ORDER[idx + 1] ?? null;
}

/**
 * Validate the requested level for an exam pass.
 * - Falls back to the natural next level when none provided.
 * - Refuses to skip levels (e.g. N → C).
 */
export function resolvePassedLevel(
  current: LevelBand | null | undefined,
  proposed?: LevelBand | null,
): LevelBand {
  if (!proposed) {
    const next = nextLevel(current);
    if (!next) throw new LevelProgressionError("Trainee is already at the top level");
    return next;
  }
  const currentIdx = current ? ORDER.indexOf(current) : -1;
  const proposedIdx = ORDER.indexOf(proposed);
  if (proposedIdx < 0) throw new LevelProgressionError(`Unknown level ${proposed}`);
  if (proposedIdx <= currentIdx) {
    throw new LevelProgressionError(
      `Proposed level ${proposed} is not above current level ${current}`,
    );
  }
  if (proposedIdx > currentIdx + 1) {
    throw new LevelProgressionError("Cannot skip levels — promote one step at a time");
  }
  return proposed;
}
